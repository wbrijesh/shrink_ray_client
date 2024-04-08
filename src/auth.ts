import { Lucia } from "lucia";
import { LibSQLAdapter } from "@lucia-auth/adapter-sqlite";
import { db } from "@/lib/db";

const dbAuthTableNames = {
  user: "user",
  session: "session",
};

const adapter = new LibSQLAdapter(db, dbAuthTableNames);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      // set to `true` when using HTTPS
      secure: false,
    },
  },
});

// IMPORTANT!
declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
  }
}
