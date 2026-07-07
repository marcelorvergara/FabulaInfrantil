import { Request, Response, NextFunction } from "express";
import LlmTelemetryRepo from "../repository/llmTelemetry.repo";

async function llmMetrics(req: Request, res: Response, next: NextFunction) {
  const key = req.header("X-Internal-Key");
  if (!key || key !== process.env.INTERNAL_API_KEY) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const aggregates = await LlmTelemetryRepo.getAggregates24h();
    res.status(200).json(aggregates);
  } catch (err) {
    next(err);
  }
}

export default { llmMetrics };
