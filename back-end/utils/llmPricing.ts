const GPT_4O_MINI_INPUT_USD_PER_1M = 0.15;
const GPT_4O_MINI_OUTPUT_USD_PER_1M = 0.6;

// fal.ai flux/schnell has no per-call cost in its response; this is fal's published flat rate for square_hd.
const FAL_FLUX_SCHNELL_COST_USD = 0.003;

export function calcTextCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  if (model !== "gpt-4o-mini") {
    return 0;
  }
  return (
    (inputTokens / 1_000_000) * GPT_4O_MINI_INPUT_USD_PER_1M +
    (outputTokens / 1_000_000) * GPT_4O_MINI_OUTPUT_USD_PER_1M
  );
}

export function calcImageCostUsd(): number {
  return FAL_FLUX_SCHNELL_COST_USD;
}
