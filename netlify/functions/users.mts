import type { Context } from "@netlify/functions";
import { db, users } from "../db/client";

export default async (req: Request, _ctx: Context) => {
  if (req.method === "GET") {
    const rows = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .limit(20);
    return Response.json(rows);
  }

  if (req.method === "POST") {
    const { email } = await req.json();
    const [row] = await db
      .insert(users)
      .values({ id: crypto.randomUUID(), email })
      .returning({ id: users.id, email: users.email });
    return Response.json(row, { status: 201 });
  }

  return new Response("Method Not Allowed", { status: 405 });
};
