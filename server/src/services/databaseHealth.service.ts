import mongoose from "mongoose";
import { getDatabaseMode, getDatabaseState } from "../config/database";

export interface DatabaseHealth {
  ok: boolean;
  state: string;
  mode: string;
  reasoningModel: string;
  databaseName?: string;
  host?: string;
  collections?: string[];
  checkedAt: string;
}

export async function getDatabaseHealth(): Promise<DatabaseHealth> {
  const connection = mongoose.connection;
  const state = getDatabaseState();

  if (connection.readyState !== 1 || !connection.db) {
    return {
      ok: false,
      state,
      mode: getDatabaseMode(),
      reasoningModel: reasoningModel(),
      checkedAt: new Date().toISOString()
    };
  }

  await connection.db.admin().ping();
  const collections = await connection.db.listCollections().toArray();

  return {
    ok: true,
    state,
    mode: getDatabaseMode(),
    reasoningModel: reasoningModel(),
    databaseName: connection.db.databaseName,
    host: connection.host,
    collections: collections.map((collection) => collection.name).sort(),
    checkedAt: new Date().toISOString()
  };
}

// Shown in the dashboard header so you can tell at a glance which brain the agents are using.
function reasoningModel(): string {
  if (process.env.GROQ_API_KEY) return `groq:${process.env.GROQ_MODEL || "openai/gpt-oss-20b"}`;
  if (process.env.OPENAI_API_KEY) return `openai:${process.env.OPENAI_MODEL || "gpt-4o-mini"}`;
  return "rules-only";
}
