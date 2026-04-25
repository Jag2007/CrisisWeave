import mongoose from "mongoose";
import { getDatabaseState } from "../config/database";

export interface DatabaseHealth {
  ok: boolean;
  state: string;
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
      checkedAt: new Date().toISOString()
    };
  }

  await connection.db.admin().ping();
  const collections = await connection.db.listCollections().toArray();

  return {
    ok: true,
    state,
    databaseName: connection.db.databaseName,
    host: connection.host,
    collections: collections.map((collection) => collection.name).sort(),
    checkedAt: new Date().toISOString()
  };
}
