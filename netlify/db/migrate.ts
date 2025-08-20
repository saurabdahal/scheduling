import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { migrate } from 'drizzle-orm/neon-http/migrator'

async function main() {
  const url = process.env.NETLIFY_DATABASE_URL ?? process.env.DATABASE_URL!
  const sql = neon(url)
  const db = drizzle(sql)
  await migrate(db, { migrationsFolder: './drizzle' })
  console.log('✅ migrations applied')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
