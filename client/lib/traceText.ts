// Turns raw agent trace text into readable sentences without hiding the decision.
export function friendlyTraceText(value: unknown): string {
  const text = String(value || "").trim();
  if (!text) return "-";

  const lower = text.toLowerCase();
  if (
    lower.includes("request failed") ||
    lower.includes("rate-limited") ||
    lower.includes("rate limit") ||
    lower.includes("api key") ||
    lower.includes("unavailable for this agent step") ||
    lower.includes("structured_fallback")
  ) {
    return "The LLM was unavailable for this step, so the rule-based fallback made the decision.";
  }

  return text
    .replaceAll("Provider groq:", "")
    .replaceAll("Provider openai:", "")
    .replaceAll("Reasoning provider: groq", "Reasoned by Groq.")
    .replaceAll("Reasoning provider: openai", "Reasoned by OpenAI.")
    .trim();
}

// Which brain made a step: "groq", "openai" or "rules" (the deterministic fallback).
export function traceProvider(trace: { provider?: string; critique?: string }): "groq" | "openai" | "rules" {
  const source = String(trace.provider || trace.critique || "").toLowerCase();
  if (source.includes("groq")) return "groq";
  if (source.includes("openai")) return "openai";
  return "rules";
}
