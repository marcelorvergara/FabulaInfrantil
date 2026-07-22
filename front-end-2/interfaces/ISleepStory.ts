export interface ISleepStoryVoice {
  /** Matches EngineName in back-end/scripts/lib/ttsEngines.ts - duplicated here as a
   *  plain literal since this is a frontend runtime interface, not importing a
   *  back-end script's type into frontend code. */
  engine: "google" | "openai" | "elevenlabs";
  /** Human-facing label, e.g. "Voz suave" - deliberately not the vendor name. */
  label: string;
  /** GCS mp3 URL, e.g. https://storage.googleapis.com/images-gen/sleep-audio/{slug}-{engine}.mp3 */
  audioUrl: string;
  /** Cumulative ms offset where each paragraph's narration begins in audioUrl,
   *  measured against the encoded audio stream (includes inter-paragraph
   *  silence) - not the sum of paragraph durations. Same length as paragraphs.
   *  Per-voice because different engines pace speech differently. */
  paragraphTimestamps: number[];
}

export interface ISleepStory {
  slug: string;
  title: string;
  teaser: string;
  estimatedMinutes: number;
  paragraphs: string[];
  /** At least one; player defaults to voices[0] absent a stored preference. */
  voices: ISleepStoryVoice[];
}
