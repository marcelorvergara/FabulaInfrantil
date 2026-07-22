/**
 * ship-white-noise.ts - generate the Modo Soninho end-of-story ambient noise
 * loop and upload it to GCS.
 *
 * The loop is synthesized with ffmpeg's anoisesrc lavfi filter (brown noise by
 * default - deeper and more rain-like than harsh white noise) rather than a
 * licensed/sourced track, so there's no rights question and no manual
 * sourcing step. Since it's random noise, a loop point has no audible
 * "pattern" seam - but MP3 encoding itself adds a few dozen ms of
 * encoder delay/padding at the boundary, which reads as a periodic tick under
 * <audio loop> on a short clip. Default duration is 5 minutes (not the ~1
 * minute a narration-length clip would need) specifically to make that seam
 * rare - most listening sessions end long before the loop point is ever
 * reached.
 *
 * The clip is also generated quiet (low --amplitude) rather than at
 * conversational volume, because the frontend plays it at HTMLAudioElement
 * volume 1.0 on platforms where .volume can't be set at all (iOS Safari -
 * see SleepNarrationPlayer.tsx). Baking the ambient loudness into the file
 * itself is what keeps iOS from playing this ~3x too loud as a hard cut over
 * a drowsy child. Tune --amplitude by listening to the LOCAL sample (this
 * script without --upload) at full/native volume before shipping.
 *
 * Run (from back-end/):
 *   npx tsx scripts/ship-white-noise.ts                      # local sample only, ./tts-bakeoff/ambient-sample.mp3
 *   npx tsx scripts/ship-white-noise.ts --color pink --amplitude 0.15   # iterate on the sound
 *   npx tsx scripts/ship-white-noise.ts --upload              # generate AND upload to the real images-gen bucket
 *
 * Uploads to the existing `images-gen` GCS bucket under
 * sleep-audio/ambient-{color}-noise.mp3 (same bucket/project/public-read/
 * immutable-cache pattern as ship-sleep-audio.ts). If you ever regenerate
 * with different tuning, upload under a new filename (e.g.
 * ambient-brown-noise-v2.mp3) instead of overwriting - the immutable cache
 * header means the old file keeps being served for up to a year otherwise.
 */

import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { Storage } from "@google-cloud/storage";
import ffmpegStatic from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";
import { GCP_PROJECT_ID, getArg } from "./lib/ttsEngines";

if (ffmpegStatic) ffmpeg.setFfmpegPath(ffmpegStatic);

const GCS_BUCKET = "images-gen";
const GCS_PREFIX = "sleep-audio";

type NoiseColor = "brown" | "pink" | "white";

function generateNoise(color: NoiseColor, durationSec: number, amplitude: number): Promise<Buffer> {
  const workDir = join(tmpdir(), `white-noise-${randomUUID()}`);
  mkdirSync(workDir, { recursive: true });
  const outPath = join(workDir, "out.mp3");

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(`anoisesrc=d=${durationSec}:c=${color}:a=${amplitude}`)
      .inputFormat("lavfi")
      .audioChannels(1)
      .audioBitrate("96k")
      .format("mp3")
      .on("error", (err) => {
        rmSync(workDir, { recursive: true, force: true });
        reject(err);
      })
      .on("end", () => {
        const buf = readFileSync(outPath);
        rmSync(workDir, { recursive: true, force: true });
        resolve(buf);
      })
      .save(outPath);
  });
}

async function main() {
  const color = (getArg("--color") ?? "brown") as NoiseColor;
  if (!["brown", "pink", "white"].includes(color)) {
    console.error(`--color must be one of: brown, pink, white`);
    process.exit(1);
  }
  const durationSec = Number(getArg("--duration") ?? 300);
  const amplitude = Number(getArg("--amplitude") ?? 0.12);
  const shouldUpload = process.argv.includes("--upload");

  console.log(`Generating ${durationSec}s of ${color} noise at amplitude ${amplitude}...`);
  const mp3 = await generateNoise(color, durationSec, amplitude);
  console.log(`Generated ${(mp3.length / 1024 / 1024).toFixed(2)} MB`);

  if (!shouldUpload) {
    const sampleDir = "./tts-bakeoff";
    mkdirSync(sampleDir, { recursive: true });
    const samplePath = join(sampleDir, "ambient-sample.mp3");
    writeFileSync(samplePath, mp3);
    console.log(`\nWrote local sample: ${samplePath}`);
    console.log(`Listen at FULL/native volume (that's what iOS effectively always plays at).`);
    console.log(`Happy with it? Re-run with --upload to ship to the real bucket.`);
    return;
  }

  const storage = new Storage({ projectId: GCP_PROJECT_ID, keyFilename: process.env.APP_CRED });
  const bucket = storage.bucket(GCS_BUCKET);
  const fileName = `${GCS_PREFIX}/ambient-${color}-noise.mp3`;
  const file = bucket.file(fileName);
  await file.save(mp3, {
    contentType: "audio/mpeg",
    metadata: { cacheControl: "public, max-age=31536000, immutable" },
  });

  const audioUrl = `https://storage.googleapis.com/${GCS_BUCKET}/${fileName}`;
  console.log(`\nUploaded: ${audioUrl}`);
  console.log(`Paste this into NOISE_LOOP_URL in front-end-2/components/SleepNarrationPlayer.tsx`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
