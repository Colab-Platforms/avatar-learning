import { ChatGroq } from "@langchain/groq";
import { ApiError } from "@/utils/ApiError.js";
import STATUS_CODES from "@/utils/statusCodes.js";

export interface GroqModelOptions {
  temperature?: number;
  maxTokens?: number;
}

const modelCache = new Map<string, ChatGroq>();

export function getGroqModel(options: GroqModelOptions = {}): ChatGroq {
  const temperature = options.temperature ?? 0.2;
  const maxTokens = options.maxTokens ?? 600;
  const cacheKey = `${temperature}:${maxTokens}`;

  const cached = modelCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new ApiError(
      "AI service is currently unavailable. Missing GROQ_API_KEY.",
      STATUS_CODES.SERVER_ERROR,
    );
  }

  const model = new ChatGroq({
    apiKey,
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    temperature,
    maxTokens,
  });

  modelCache.set(cacheKey, model);
  return model;
}

export function getGroqProviderName(): string {
  return "groq";
}

export function getGroqModelName(): string {
  return process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
}
