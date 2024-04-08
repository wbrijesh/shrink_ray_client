import { db } from "@/lib/db";
import { Argon2id } from "oslo/password";
import { lucia } from "@/lib/auth";

import type { NextApiRequest, NextApiResponse } from "next";
import type { DatabaseUser } from "@/lib/db";
import { ResultSet } from "@libsql/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.status(404).end();
    return;
  }

  const body: null | Partial<{ username: string; password: string }> = req.body;
  const username = body?.username;
  if (
    !username ||
    username.length < 3 ||
    username.length > 31 ||
    !/^[a-z0-9_-]+$/.test(username)
  ) {
    res.status(400).json({
      error: "Invalid username",
    });
    return;
  }
  const password = body?.password;
  if (!password || password.length < 6 || password.length > 255) {
    res.status(400).json({
      error: "Invalid password",
    });
    return;
  }

  // const existingUser = db
  //   .prepare("SELECT * FROM user WHERE username = ?")
  //   .get(username) as DatabaseUser | undefined;

  let test: ResultSet;
  const existingUserResultSet = db.execute({
    sql: "SELECT * FROM user WHERE username = ?",
    args: [username],
  });

  // get exisiting user from Promise<ResultSet>
  // Property '0' does not exist on type 'Promise<ResultSet>' what else could it be?
  // ANSWER: to get DatabaseUser from Promise<ResultSet> we need to await the Promise<ResultSet>
  const existingUser = (await existingUserResultSet).toJSON() as
    | DatabaseUser
    | undefined;

  if (!existingUser) {
    res.status(400).json({
      error: "Incorrect username or password",
    });
    return;
  }

  const validPassword = await new Argon2id().verify(
    existingUser.password,
    password
  );
  if (!validPassword) {
    res.status(400).json({
      error: "Incorrect username or password",
    });
    return;
  }

  const session = await lucia.createSession(existingUser.id, {});
  res
    .appendHeader(
      "Set-Cookie",
      lucia.createSessionCookie(session.id).serialize()
    )
    .status(200)
    .end();
}

export const runtime = "edge";
