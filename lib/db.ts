import { neon } from '@neondatabase/serverless'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.warn('DATABASE_URL is not set; database features will fail at runtime.')
}

export const sql = connectionString ? neon(connectionString) : null

export function getSql() {
  if (!sql) throw new Error('DATABASE_URL is not set')
  return sql
}
