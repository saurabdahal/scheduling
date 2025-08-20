import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./user_schema";

const url = process.env.NETLIFY_DATABASE_URL ?? process.env.DATABASE_URL!;
const sql = neon(url);

export const db = drizzle(sql, { schema });
export { users } from "./user_schema";
