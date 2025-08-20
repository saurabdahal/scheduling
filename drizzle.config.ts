// drizzle.config.ts
import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: './netlify/db/user_schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.NETLIFY_DATABASE_URL ?? process.env.DATABASE_URL!,
  },
})
