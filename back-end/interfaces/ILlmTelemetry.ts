export interface ILlmTelemetry {
  occurred_at: Date;
  endpoint: string;
  model: string;
  latency_ms: number;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  success: boolean;
  error_message: string | null;
}

export interface ILlmMetricsAggregate {
  requests_24h: number;
  avg_latency_ms: number;
  tokens_24h: number;
  cost_usd_24h: number;
  error_rate_pct: number;
}
