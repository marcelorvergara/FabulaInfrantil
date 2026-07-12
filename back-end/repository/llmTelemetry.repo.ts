import { Firestore } from "@google-cloud/firestore";
import dotenv from "dotenv";
import { ILlmMetricsAggregate, ILlmTelemetry } from "../interfaces/ILlmTelemetry";

dotenv.config();

const db = new Firestore({
  projectId: "generate-380122",
  keyFilename: process.env.APP_CRED,
});

const collectionName = "llm_telemetry";

async function logTelemetry(entry: ILlmTelemetry): Promise<void> {
  await db.collection(collectionName).add(entry);
}

async function getAggregates24h(): Promise<ILlmMetricsAggregate> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const snapshot = await db
    .collection(collectionName)
    .where("occurred_at", ">=", since)
    .get();

  const requests_24h = snapshot.size;
  let totalLatencyMs = 0;
  let tokens_24h = 0;
  let cost_usd_24h = 0;
  let errorCount = 0;

  snapshot.forEach((doc) => {
    const data = doc.data() as ILlmTelemetry;
    totalLatencyMs += data.latency_ms;
    tokens_24h += data.input_tokens + data.output_tokens;
    cost_usd_24h += data.cost_usd;
    if (!data.success) {
      errorCount += 1;
    }
  });

  return {
    requests_24h,
    avg_latency_ms: requests_24h > 0 ? totalLatencyMs / requests_24h : null,
    tokens_24h,
    cost_usd_24h,
    error_rate_pct: requests_24h > 0 ? (errorCount / requests_24h) * 100 : null,
  };
}

export default {
  logTelemetry,
  getAggregates24h,
};
