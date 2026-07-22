/**
 * ship-sleep-audio.ts - render the full Modo Soninho library with one or more
 * winning engines from the bake-off, transcode to MP3, and upload to GCS.
 *
 * Run only AFTER scripts/render-sleep-audio.ts has been blind-listened and the
 * winning engine(s) picked - this hits paid TTS APIs and writes to the real
 * `images-gen` bucket. Supports multiple engines per story (e.g. the bake-off
 * turned up two winners) so listeners can be given a voice choice - see
 * ISleepStory.voices in front-end-2/interfaces/ISleepStory.ts.
 *
 * One-time setup (from back-end/):
 *   npm i -D ffmpeg-static fluent-ffmpeg @types/fluent-ffmpeg
 *
 * Run (from back-end/):
 *   npx tsx scripts/ship-sleep-audio.ts --engines openai,elevenlabs
 *   npx tsx scripts/ship-sleep-audio.ts --engines openai,elevenlabs --story a-nuvem-sonolenta   # single story, e.g. to re-render after a typo fix
 *
 * What it does per story x engine:
 *   1. Renders paragraphs with the engine, assembles one WAV, and records
 *      paragraphTimestamps (ms) against the ACTUAL encoded stream - i.e.
 *      including every inserted inter-paragraph silence gap, not just the sum
 *      of paragraph durations. Getting this wrong is invisible in a quick
 *      check and shows up later as progress dots drifting behind the
 *      narration. Timestamps are engine-specific since different engines
 *      pace speech differently - that's why each voice carries its own array.
 *   2. Transcodes to MP3, mono, 96kbps (-ac 1 -b:a 96k) - this is spoken
 *      narration, not music; ffmpeg's stereo/128kbps+ defaults would roughly
 *      double file size for no audible difference on a phone speaker.
 *   3. Uploads to the existing `images-gen` GCS bucket under
 *      sleep-audio/{slug}-{engine}.mp3 (same bucket/project/public-read
 *      pattern as generateImage.controller.ts), with an immutable, one-year
 *      Cache-Control header since these files never change once shipped. If
 *      you ever re-render a story/engine, upload under a versioned filename
 *      ({slug}-{engine}-v2.mp3) instead of overwriting - otherwise the
 *      immutable cache header means the old voice keeps being served for a
 *      year.
 *
 * Output: prints a ready-to-paste `voices: [...]` snippet per story, and
 * writes the same data to ./tts-bakeoff/sleep-audio-manifest.json. Each
 * voice's printed `label` defaults to a capitalized engine name - when
 * hand-editing into sleepStories.ts, prefer something descriptive (e.g. "Voz
 * suave" / "Voz calorosa" based on what the blind test actually heard) over
 * generic numbering, since a parent choosing between two unlabeled options at
 * bedtime deserves an actual choice, not a coin flip.
 */

import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { Storage } from "@google-cloud/storage";
import ffmpegStatic from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";
import { sleepStories } from "../../front-end-2/data/sleepStories";
import { assemble, EngineName, GCP_PROJECT_ID, getArg, ISleepStory, renderers } from "./lib/ttsEngines";

if (ffmpegStatic) ffmpeg.setFfmpegPath(ffmpegStatic);

const GCS_BUCKET = "images-gen";
const GCS_PREFIX = "sleep-audio";

const storage = new Storage({ projectId: GCP_PROJECT_ID, keyFilename: process.env.APP_CRED });
const bucket = storage.bucket(GCS_BUCKET);

const DEFAULT_LABEL: Record<EngineName, string> = {
  google: "Google",
  openai: "OpenAI",
  elevenlabs: "ElevenLabs",
};

interface IShippedVoice {
  engine: EngineName;
  label: string;
  audioUrl: string;
  paragraphTimestamps: number[];
}

function wavToMp3(wav: Buffer): Promise<Buffer> {
  const workDir = join(tmpdir(), `sleep-audio-${randomUUID()}`);
  mkdirSync(workDir, { recursive: true });
  const wavPath = join(workDir, "in.wav");
  const mp3Path = join(workDir, "out.mp3");
  writeFileSync(wavPath, wav);

  return new Promise((resolve, reject) => {
    ffmpeg(wavPath)
      .audioChannels(1)
      .audioBitrate("96k")
      .format("mp3")
      .on("error", (err) => {
        rmSync(workDir, { recursive: true, force: true });
        reject(err);
      })
      .on("end", () => {
        const buf = readFileSync(mp3Path);
        rmSync(workDir, { recursive: true, force: true });
        resolve(buf);
      })
      .save(mp3Path);
  });
}

async function shipVoice(story: ISleepStory, engine: EngineName): Promise<IShippedVoice> {
  console.log(`\n=== ${story.title} (${story.slug}) - engine: ${engine} ===`);
  const render = await renderers[engine](story);
  const { wav, paragraphTimestamps } = assemble(render);

  console.log(`  transcoding to mp3 (mono, 96kbps)...`);
  const mp3 = await wavToMp3(wav);

  const fileName = `${GCS_PREFIX}/${story.slug}-${engine}.mp3`;
  const file = bucket.file(fileName);
  await file.save(mp3, {
    contentType: "audio/mpeg",
    metadata: { cacheControl: "public, max-age=31536000, immutable" },
  });

  const audioUrl = `https://storage.googleapis.com/${GCS_BUCKET}/${fileName}`;
  console.log(`  uploaded: ${audioUrl} (${(mp3.length / 1024).toFixed(0)} KB)`);

  return { engine, label: DEFAULT_LABEL[engine], audioUrl, paragraphTimestamps };
}

async function main() {
  const engines = (getArg("--engines") ?? "").split(",").filter(Boolean) as EngineName[];
  if (engines.length === 0 || engines.some((e) => !renderers[e])) {
    console.error(`--engines is required, comma-separated, each one of: ${Object.keys(renderers).join(", ")}`);
    process.exit(1);
  }

  const onlySlug = getArg("--story");
  const stories = (sleepStories as ISleepStory[]).filter((s) => !onlySlug || s.slug === onlySlug);
  if (stories.length === 0) {
    console.error(`Story "${onlySlug}" not found.`);
    process.exit(1);
  }

  const results: { slug: string; voices: IShippedVoice[] }[] = [];
  for (const story of stories) {
    const voices: IShippedVoice[] = [];
    for (const engine of engines) {
      voices.push(await shipVoice(story, engine));
    }
    results.push({ slug: story.slug, voices });
  }

  console.log(`\n\n=== Paste into front-end-2/data/sleepStories.ts ===\n`);
  for (const r of results) {
    console.log(`// ${r.slug}`);
    console.log(`voices: ${JSON.stringify(r.voices, null, 2)},\n`);
  }

  const manifestDir = "./tts-bakeoff";
  mkdirSync(manifestDir, { recursive: true });
  const manifestPath = join(manifestDir, "sleep-audio-manifest.json");
  writeFileSync(manifestPath, JSON.stringify({ engines, results }, null, 2));
  console.log(`Wrote ${manifestPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
