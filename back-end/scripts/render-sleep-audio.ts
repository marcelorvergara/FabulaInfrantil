/**
 * render-sleep-audio.ts - pt-BR TTS bake-off for Modo Soninho
 *
 * Renders ONE sleep story through up to 3 TTS engines (Google Cloud TTS,
 * OpenAI gpt-4o-mini-tts, ElevenLabs) and writes one WAV per engine so you
 * can blind-listen and pick the winning voice.
 *
 * Location: back-end/scripts/render-sleep-audio.ts
 *   (lives in back-end because the openai SDK + GCP credentials are already there)
 *
 * One-time setup (from back-end/):
 *   npm i -D @google-cloud/text-to-speech tsx
 *
 * Auth:
 *   Google     - GOOGLE_APPLICATION_CREDENTIALS=/path/to/sa.json (or `gcloud auth application-default login`)
 *   OpenAI     - OPENAI_API_KEY (already in your .env)
 *   ElevenLabs - ELEVENLABS_API_KEY (+ ELEVENLABS_VOICE_ID); skipped if unset
 *
 * Run (from back-end/):
 *   npx tsx scripts/render-sleep-audio.ts --story a-nuvem-sonolenta
 *   npx tsx scripts/render-sleep-audio.ts --story a-nuvem-sonolenta --engines google,openai
 *   npx tsx scripts/render-sleep-audio.ts --story a-nuvem-sonolenta --no-blind
 *
 * Output (default): ./tts-bakeoff/<slug>/blind/candidate-A.wav, candidate-B.wav, ...
 *   + key.json - the engine-to-file mapping. DON'T open it until you've scored them.
 *
 * Design notes:
 * - Each paragraph is synthesized as its own request (keeps Google under the
 *   5000-byte SSML limit and OpenAI under its input limit), then the PCM is
 *   concatenated with real inserted silence between paragraphs. This gives
 *   identical pacing structure across engines, so you're comparing VOICE, not
 *   accidental differences in pause handling.
 * - Everything is rendered/kept as WAV (lossless) for the listening test.
 *   Convert the winner to mp3 with scripts/ship-sleep-audio.ts later.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { sleepStories } from "../../front-end-2/data/sleepStories";
import { assemble, EngineName, getArg, ISleepStory, renderers } from "./lib/ttsEngines";

async function main() {
  const stories = sleepStories as ISleepStory[];
  const slug = getArg("--story") ?? stories[0].slug;
  const story = stories.find((s) => s.slug === slug);
  if (!story) {
    console.error(`Story "${slug}" not found. Available: ${stories.map((s) => s.slug).join(", ")}`);
    process.exit(1);
  }

  const requested = (getArg("--engines") ?? "google,openai,elevenlabs").split(",") as EngineName[];
  const blind = !process.argv.includes("--no-blind");
  const outRoot = getArg("--out") ?? "./tts-bakeoff";

  console.log(`Story: "${story.title}" (${story.paragraphs.length} paragraphs, ~${story.estimatedMinutes} min)`);
  console.log(`Engines requested: ${requested.join(", ")}\n`);

  const results: { engine: EngineName; wav: Buffer }[] = [];
  for (const engine of requested) {
    if (engine === "elevenlabs" && !process.env.ELEVENLABS_API_KEY) {
      console.log("elevenlabs: no ELEVENLABS_API_KEY - skipping (optional candidate)\n");
      continue;
    }
    console.log(`Rendering with ${engine}...`);
    try {
      const render = await renderers[engine](story);
      const { wav } = assemble(render);
      results.push({ engine, wav });
      console.log(`  ${engine}: done\n`);
    } catch (err) {
      console.error(`  ${engine}: FAILED - ${(err as Error).message}\n`);
    }
  }

  if (results.length === 0) {
    console.error("No engine produced audio. Check credentials.");
    process.exit(1);
  }

  const dir = join(outRoot, story.slug, blind ? "blind" : "named");
  mkdirSync(dir, { recursive: true });

  if (blind) {
    const shuffled = [...results].sort(() => Math.random() - 0.5);
    const key: Record<string, string> = {};
    shuffled.forEach((r, idx) => {
      const label = String.fromCharCode(65 + idx); // A, B, C
      const file = `candidate-${label}.wav`;
      writeFileSync(join(dir, file), r.wav);
      key[file] = r.engine;
      console.log(`Wrote ${join(dir, file)}`);
    });
    writeFileSync(join(dir, "key.json"), JSON.stringify(key, null, 2));
    console.log(`\nWrote ${join(dir, "key.json")} - DON'T open it until you've scored the candidates.`);
  } else {
    for (const r of results) {
      const file = `${r.engine}.wav`;
      writeFileSync(join(dir, file), r.wav);
      console.log(`Wrote ${join(dir, file)}`);
    }
  }

  console.log(
    `\nListening protocol: night, real bedtime volume, PHONE SPEAKER (not headphones).` +
      `\nScore each 1-5 on: pacing feels sleepy / voice feels warm / pauses breathe.` +
      `\nOnly then open key.json.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
