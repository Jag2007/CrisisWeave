// Central LLM provider chain for every CrisisWeave agent. Groq is tried first,
// OpenAI is the backup provider, and deterministic local logic is the final safe fallback.
import type { AgentName } from "../utils/enums";

export type LlmProvider = "groq" | "openai" | "structured_fallback";

export interface LlmResult<T> {
  provider: LlmProvider;
  data: T;
  rawText?: string;
  error?: string;
}

interface LlmRequest<T> {
  agentName: AgentName;
  goal: string;
  input: unknown;
  outputContract: string;
  fallback: () => T | Promise<T>;
}

const groqModel = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const openAiModel = process.env.OPENAI_MODEL || "gpt-4o-mini";

function buildPrompt(request: Omit<LlmRequest<unknown>, "fallback">): string {
  return [
    `You are ${request.agentName}, an emergency dispatch reasoning agent in CrisisWeave.`,
    `Goal: ${request.goal}`,
    "Return ONLY valid JSON. No markdown. No prose outside JSON.",
    `Output contract: ${request.outputContract}`,
    "Input:",
    JSON.stringify(request.input, null, 2)
  ].join("\n\n");
}

function parseJsonObject<T>(text: string): T {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("LLM response did not contain a JSON object.");
    }
    return JSON.parse(match[0]) as T;
  }
}

async function callGroq<T>(prompt: string): Promise<{ data: T; rawText: string }> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: groqModel,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: "You are an emergency dispatch reasoning agent. Return only strict JSON."
        },
        { role: "user", content: prompt }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Groq request failed with ${response.status}: ${await response.text()}`);
  }

  const body = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const rawText = body.choices?.[0]?.message?.content || "";
  if (!rawText) {
    throw new Error("Groq returned an empty response.");
  }

  return { data: parseJsonObject<T>(rawText), rawText };
}

async function callOpenAI<T>(prompt: string): Promise<{ data: T; rawText: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: openAiModel,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are an emergency dispatch reasoning agent. Return only strict JSON."
        },
        { role: "user", content: prompt }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with ${response.status}: ${await response.text()}`);
  }

  const body = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const rawText = body.choices?.[0]?.message?.content || "";
  if (!rawText) {
    throw new Error("OpenAI returned an empty response.");
  }

  return { data: parseJsonObject<T>(rawText), rawText };
}

function summarizeProviderError(provider: "Groq" | "OpenAI", error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (lower.includes("not configured")) {
    return `${provider} is not configured.`;
  }
  if (lower.includes("429") || lower.includes("rate limit")) {
    return `${provider} is temporarily rate-limited.`;
  }
  if (lower.includes("401") || lower.includes("403") || lower.includes("invalid") || lower.includes("unauthorized")) {
    return `${provider} rejected the configured API key.`;
  }
  if (lower.includes("json")) {
    return `${provider} returned a response the agent could not safely parse.`;
  }

  return `${provider} was unavailable for this agent step.`;
}

export async function reasonWithLlmOrFallback<T>(request: LlmRequest<T>): Promise<LlmResult<T>> {
  const prompt = buildPrompt(request);
  const errors: string[] = [];

  try {
    const groq = await callGroq<T>(prompt);
    return { provider: "groq", data: groq.data, rawText: groq.rawText };
  } catch (error) {
    errors.push(summarizeProviderError("Groq", error));
  }

  try {
    const openAi = await callOpenAI<T>(prompt);
    return { provider: "openai", data: openAi.data, rawText: openAi.rawText };
  } catch (error) {
    errors.push(summarizeProviderError("OpenAI", error));
  }

  return {
    provider: "structured_fallback",
    data: await request.fallback(),
    error: errors.join(" | ")
  };
}
