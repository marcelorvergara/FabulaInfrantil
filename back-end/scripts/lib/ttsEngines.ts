/**
 * Shared TTS rendering primitives for the Modo Soninho bake-off / ship scripts.
 * Used by both scripts/render-sleep-audio.ts (blind listening test) and
 * scripts/ship-sleep-audio.ts (final render + GCS upload) so the paragraph
 * assembly / timestamp math only lives in one place.
 */

import dotenv from "dotenv";
// Same pattern as every other back-end entry point (index.ts, services/*, repository/*) -
// these scripts run standalone via tsx, so nothing else loads back-end/.env for them.
dotenv.config();

// This project (not whatever GCP project your ambient `gcloud`/ADC session defaults to -
// e.g. a different project you're authenticated against for other work) is what already
// hosts images-gen/Firestore for Fábula Infantil, so TTS + upload calls are pinned to it.
export const GCP_PROJECT_ID = "generate-380122";

// -- Tuning (shared pacing across every engine and every script) -----------
export const PAUSE_BETWEEN_PARAGRAPHS_MS = 1200; // must "breathe" - same for all engines
export const TRAILING_SILENCE_MS = 2500;

// Google: SSML prosody is where the "sleepiness" comes from.
// NOTE: keep a Neural2/Wavenet voice here - Chirp3-HD voices do NOT accept SSML.
export const GOOGLE_VOICE = process.env.GOOGLE_TTS_VOICE ?? "pt-BR-Neural2-A";
export const GOOGLE_SSML_RATE = "85%";
export const GOOGLE_SSML_PITCH = "-2st";

// OpenAI: no SSML - pacing/warmth is steered via natural-language instructions.
export const OPENAI_TTS_MODEL = process.env.OPENAI_TTS_MODEL ?? "gpt-4o-mini-tts";
export const OPENAI_VOICE = process.env.OPENAI_TTS_VOICE ?? "nova";
export const OPENAI_INSTRUCTIONS =
  "Narre em português brasileiro, muito lentamente, com voz suave, calorosa e baixa, " +
  "como quem conta uma história de ninar para uma criança quase dormindo. " +
  "Ritmo constante e calmo, sem entusiasmo, terminando as frases com entonação descendente.";

// ElevenLabs (optional third candidate)
export const ELEVEN_MODEL = process.env.ELEVENLABS_MODEL ?? "eleven_multilingual_v2";
export const ELEVEN_VOICE_ID = process.env.ELEVENLABS_VOICE_ID ?? ""; // pick a pt-BR-capable voice in their library

export type EngineName = "google" | "openai" | "elevenlabs";

export interface ISleepStory {
  slug: string;
  title: string;
  teaser: string;
  estimatedMinutes: number;
  paragraphs: string[];
}

/** One PCM buffer per paragraph, NOT yet assembled with silence. */
export interface IEngineRender {
  engine: EngineName;
  sampleRate: number;
  channels: number;
  paragraphPcm: Buffer[]; // 16-bit LE PCM, one entry per story paragraph
}

/** Final assembled audio + where each paragraph starts in it. */
export interface IAssembledAudio {
  wav: Buffer;
  /** Cumulative ms offset where each paragraph's narration begins in `wav`,
   *  measured against the actual encoded PCM stream (i.e. it already accounts
   *  for every inserted inter-paragraph silence) - NOT the sum of paragraph
   *  durations alone. Same length as story.paragraphs. */
  paragraphTimestamps: number[];
}

// -- Minimal WAV utilities (16-bit PCM only) --------------------------------

export function parseWav(buf: Buffer): { sampleRate: number; channels: number; pcm: Buffer } {
  if (buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WAVE") {
    throw new Error("Not a RIFF/WAVE file");
  }
  let offset = 12;
  let sampleRate = 0;
  let channels = 0;
  let bitsPerSample = 0;
  let pcm: Buffer | null = null;

  while (offset + 8 <= buf.length) {
    const chunkId = buf.toString("ascii", offset, offset + 4);
    const chunkSize = buf.readUInt32LE(offset + 4);
    const body = offset + 8;
    if (chunkId === "fmt ") {
      const format = buf.readUInt16LE(body);
      if (format !== 1) throw new Error(`Unsupported WAV format code ${format} (need PCM)`);
      channels = buf.readUInt16LE(body + 2);
      sampleRate = buf.readUInt32LE(body + 4);
      bitsPerSample = buf.readUInt16LE(body + 14);
    } else if (chunkId === "data") {
      pcm = buf.subarray(body, body + chunkSize);
    }
    offset = body + chunkSize + (chunkSize % 2); // chunks are word-aligned
  }

  if (!pcm || !sampleRate) throw new Error("Malformed WAV: missing fmt/data chunk");
  if (bitsPerSample !== 16) throw new Error(`Expected 16-bit PCM, got ${bitsPerSample}-bit`);
  return { sampleRate, channels, pcm };
}

export function writeWav(pcmChunks: Buffer[], sampleRate: number, channels: number): Buffer {
  const data = Buffer.concat(pcmChunks);
  const blockAlign = channels * 2;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0, "ascii");
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVE", 8, "ascii");
  header.write("fmt ", 12, "ascii");
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * blockAlign, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36, "ascii");
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

export function silence(ms: number, sampleRate: number, channels: number): Buffer {
  const samples = Math.round((sampleRate * ms) / 1000);
  return Buffer.alloc(samples * channels * 2); // 16-bit zeros
}

export function escapeSsml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Concatenates an engine's per-paragraph PCM with the standard inter-paragraph
 * and trailing silence, and records each paragraph's start offset against the
 * ACTUAL assembled byte stream (so timestamps stay accurate even though
 * silence is inserted between paragraphs - see IAssembledAudio doc above).
 */
export function assemble(render: IEngineRender): IAssembledAudio {
  const { sampleRate, channels, paragraphPcm } = render;
  const bytesPerMs = (sampleRate * channels * 2) / 1000;
  const chunks: Buffer[] = [];
  const paragraphTimestamps: number[] = [];
  let elapsedBytes = 0;

  paragraphPcm.forEach((pcm, i) => {
    paragraphTimestamps.push(Math.round(elapsedBytes / bytesPerMs));
    chunks.push(pcm);
    elapsedBytes += pcm.length;
    if (i < paragraphPcm.length - 1) {
      const pause = silence(PAUSE_BETWEEN_PARAGRAPHS_MS, sampleRate, channels);
      chunks.push(pause);
      elapsedBytes += pause.length;
    }
  });
  chunks.push(silence(TRAILING_SILENCE_MS, sampleRate, channels));

  return { wav: writeWav(chunks, sampleRate, channels), paragraphTimestamps };
}

// -- Engines -----------------------------------------------------------------

export async function renderGoogle(story: ISleepStory): Promise<IEngineRender> {
  const { TextToSpeechClient } = await import("@google-cloud/text-to-speech");
  // Pinned explicitly: relying on ADC's inferred project picks up whatever GCP project your
  // ambient gcloud/ADC session defaults to, which may not be this one if you also work in
  // other GCP projects locally.
  const client = new TextToSpeechClient({ projectId: GCP_PROJECT_ID });
  const paragraphPcm: Buffer[] = [];
  let sampleRate = 24000;
  const channels = 1;

  for (const [i, paragraph] of story.paragraphs.entries()) {
    const ssml =
      `<speak><prosody rate="${GOOGLE_SSML_RATE}" pitch="${GOOGLE_SSML_PITCH}">` +
      escapeSsml(paragraph) +
      `</prosody></speak>`;

    const [res] = await client.synthesizeSpeech({
      input: { ssml },
      voice: { languageCode: "pt-BR", name: GOOGLE_VOICE },
      audioConfig: { audioEncoding: "LINEAR16", sampleRateHertz: 24000 },
    });
    if (!res.audioContent) throw new Error(`Google TTS: empty audio for paragraph ${i}`);

    // LINEAR16 responses come wrapped in a WAV container - strip the header.
    const wav = parseWav(Buffer.from(res.audioContent as Uint8Array));
    sampleRate = wav.sampleRate;
    paragraphPcm.push(wav.pcm);
    console.log(`  google: paragraph ${i + 1}/${story.paragraphs.length}`);
  }
  return { engine: "google", sampleRate, channels, paragraphPcm };
}

export async function renderOpenAI(story: ISleepStory): Promise<IEngineRender> {
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI(); // reads OPENAI_API_KEY
  const paragraphPcm: Buffer[] = [];
  let sampleRate = 24000;
  let channels = 1;

  for (const [i, paragraph] of story.paragraphs.entries()) {
    const res = await client.audio.speech.create({
      model: OPENAI_TTS_MODEL,
      voice: OPENAI_VOICE,
      input: paragraph,
      instructions: OPENAI_INSTRUCTIONS,
      response_format: "wav",
    });
    const wav = parseWav(Buffer.from(await res.arrayBuffer()));
    sampleRate = wav.sampleRate;
    channels = wav.channels;
    paragraphPcm.push(wav.pcm);
    console.log(`  openai: paragraph ${i + 1}/${story.paragraphs.length}`);
  }
  return { engine: "openai", sampleRate, channels, paragraphPcm };
}

export async function renderElevenLabs(story: ISleepStory): Promise<IEngineRender> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY not set");
  if (!ELEVEN_VOICE_ID) throw new Error("ELEVENLABS_VOICE_ID not set");

  const paragraphPcm: Buffer[] = [];
  const sampleRate = 24000; // pcm_24000 - raw 16-bit LE mono, no container
  const channels = 1;

  for (const [i, paragraph] of story.paragraphs.entries()) {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_VOICE_ID}?output_format=pcm_24000`,
      {
        method: "POST",
        headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          text: paragraph,
          model_id: ELEVEN_MODEL,
          voice_settings: { stability: 0.7, similarity_boost: 0.6, style: 0.15, speed: 0.85 },
        }),
      },
    );
    if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
    paragraphPcm.push(Buffer.from(await res.arrayBuffer()));
    console.log(`  elevenlabs: paragraph ${i + 1}/${story.paragraphs.length}`);
  }
  return { engine: "elevenlabs", sampleRate, channels, paragraphPcm };
}

export const renderers: Record<EngineName, (s: ISleepStory) => Promise<IEngineRender>> = {
  google: renderGoogle,
  openai: renderOpenAI,
  elevenlabs: renderElevenLabs,
};

export function getArg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
