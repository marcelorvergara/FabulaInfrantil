import { Request, Response, NextFunction } from "express";
import { Storage } from "@google-cloud/storage";
import { randomUUID } from "crypto";
import GenerateImageService from "../services/generateImage.service";
import axios from "axios";
import LlmTelemetryRepo from "../repository/llmTelemetry.repo";
import { calcImageCostUsd } from "../utils/llmPricing";

const storage = new Storage({
  projectId: "generate-380122",
  keyFilename: process.env.APP_CRED,
});
const bucket = storage.bucket("images-gen");

const IMAGE_MODEL = "fal-ai/flux/schnell";

function logTelemetry(entry: {
  latencyMs: number;
  success: boolean;
  errorMessage: string | null;
}) {
  LlmTelemetryRepo.logTelemetry({
    occurred_at: new Date(),
    endpoint: "/generateImage",
    model: IMAGE_MODEL,
    latency_ms: entry.latencyMs,
    input_tokens: 0,
    output_tokens: 0,
    cost_usd: entry.success ? calcImageCostUsd() : 0,
    success: entry.success,
    error_message: entry.errorMessage,
  }).catch((err) => console.error("llm telemetry write failed", err));
}

async function generateImage(req: Request, res: Response, next: NextFunction) {
  const startTime = new Date().getTime();
  let falUrl: string;
  try {
    falUrl = await GenerateImageService.generate(req.body);
    logTelemetry({
      latencyMs: new Date().getTime() - startTime,
      success: true,
      errorMessage: null,
    });
  } catch (err) {
    logTelemetry({
      latencyMs: new Date().getTime() - startTime,
      success: false,
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    console.log(err);
    return next(err);
  }

  try {
    const download = await axios.get<Buffer>(falUrl, {
      responseType: "arraybuffer",
    });
    const buffer = Buffer.from(download.data);
    const contentType =
      (download.headers["content-type"] as string) || "image/jpeg";

    const ext = contentType.includes("png") ? "png" : "jpg";
    const fileName = `temp/${randomUUID()}.${ext}`;
    const file = bucket.file(fileName);
    await file.save(buffer, { contentType });

    const url = `https://storage.googleapis.com/images-gen/${fileName}`;
    res.status(201).json({ result: url });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

export default { generateImage };
