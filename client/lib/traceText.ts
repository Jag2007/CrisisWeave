// Converts raw agent trace text into judge-friendly explanations without hiding the decision.
export function friendlyTraceText(value: unknown): string {
  const text = String(value || "").trim();
  if (!text) return "-";

  const lower = text.toLowerCase();
  if (
    lower.includes("request failed") ||
    lower.includes("rate limit") ||
    lower.includes("api key") ||
    lower.includes("structured_fallback")
  ) {
    return "The cloud AI provider was unavailable or rate-limited, so CrisisWeave used its local safety reasoning for this step.";
  }

  return text
    .replaceAll("Provider groq:", "Groq reasoning:")
    .replaceAll("Provider openai:", "OpenAI reasoning:")
    .replaceAll("Reasoning provider: groq", "Reasoned by Groq.")
    .replaceAll("Reasoning provider: openai", "Reasoned by OpenAI.");
}
