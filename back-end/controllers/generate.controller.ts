import { Request, Response, NextFunction } from "express";
import { IBody } from "../interfaces/IPrompt";
import GenerateService, { GENERATE_MODEL } from "../services/generate.service";
import LlmTelemetryRepo from "../repository/llmTelemetry.repo";
import { calcTextCostUsd } from "../utils/llmPricing";

function logTelemetry(entry: {
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  success: boolean;
  errorMessage: string | null;
}) {
  LlmTelemetryRepo.logTelemetry({
    occurred_at: new Date(),
    endpoint: "/generate",
    model: GENERATE_MODEL,
    latency_ms: entry.latencyMs,
    input_tokens: entry.inputTokens,
    output_tokens: entry.outputTokens,
    cost_usd: calcTextCostUsd(GENERATE_MODEL, entry.inputTokens, entry.outputTokens),
    success: entry.success,
    error_message: entry.errorMessage,
  }).catch((err) => console.error("llm telemetry write failed", err));
}

async function generate(req: Request, res: Response, next: NextFunction) {
  const kw = req.params.kw;
  const age = req.params.age;
  const hero = typeof req.query.hero === "string" ? req.query.hero : undefined;
  const startTime = new Date().getTime();
  try {
    const msgs: IBody = req.body;
    const result = await GenerateService.generate(msgs, kw, age, hero);
    const elapsedMs = new Date().getTime() - startTime;
    console.log("elapsedTime", elapsedMs / 1000);
    logTelemetry({
      latencyMs: elapsedMs,
      inputTokens: result.usage?.prompt_tokens ?? 0,
      outputTokens: result.usage?.completion_tokens ?? 0,
      success: true,
      errorMessage: null,
    });
    res.status(201).json({ result: result.choices[0] });
  } catch (err) {
    logTelemetry({
      latencyMs: new Date().getTime() - startTime,
      inputTokens: 0,
      outputTokens: 0,
      success: false,
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    next(err);
  }
}

export default {
  generate,
};
