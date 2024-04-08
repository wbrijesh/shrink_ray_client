import { createClient } from "@libsql/client";
import { D1Adapter } from "@lucia-auth/adapter-sqlite";
import { Lucia } from "lucia";
import type { D1Database as WorkerD1Database } from "@cloudflare/workers-types";
import type { D1Database as MiniflareD1Database } from "@miniflare/d1";
type D1Database = WorkerD1Database | MiniflareD1Database;

export function initializeLucia(D1: D1Database) {
  const adapter = new D1Adapter(D1, {
    user: "user",
    session: "session",
  });
  return new Lucia(adapter);
}

declare module "lucia" {
  interface Register {
    Auth: ReturnType<typeof initializeLucia>;
  }
}

export const db = createClient({
  url:
    process.env.DB_CONNECTION_STRING ||
    "libsql://dbname_username.turso.io?authToken=ey",
});

db.execute(`CREATE TABLE IF NOT EXISTS user (
    id TEXT NOT NULL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
)`);

db.execute(`CREATE TABLE IF NOT EXISTS session (
    id TEXT NOT NULL PRIMARY KEY,
    expires_at INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(id)
)`);

export interface DatabaseUser {
  id: string;
  username: string;
  password: string;
}
