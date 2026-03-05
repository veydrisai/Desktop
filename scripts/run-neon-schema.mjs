#!/usr/bin/env node
/**
 * Run neon/schema.sql against the database in DATABASE_URL.
 * Usage: node scripts/run-neon-schema.mjs
 * Requires: DATABASE_URL in env (e.g. from .env.local: export $(grep -v '^#' .env.local | xargs) && node scripts/run-neon-schema.mjs)
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { neon } from '@neondatabase/serverless'

const __dirname = dirname(fileURLToPath(import.meta.url))
const schemaPath = join(__dirname, '..', 'neon', 'schema.sql')

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('Missing DATABASE_URL. Set it in .env.local or run:')
  console.error('  export $(grep -v "^#" .env.local | xargs) && node scripts/run-neon-schema.mjs')
  process.exit(1)
}

const sql = neon(connectionString)

function splitStatements(content) {
  const out = []
  let current = ''
  let inDollar = false
  let dollarTag = ''
  const lines = content.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!inDollar) {
      if (trimmed.includes('$$')) {
        inDollar = true
        dollarTag = '$$'
        current += line + '\n'
        continue
      }
      if (trimmed.endsWith(';') && !trimmed.startsWith('--')) {
        current += line + '\n'
        const stmt = current.trim()
        if (stmt) out.push(stmt)
        current = ''
        continue
      }
    } else {
      current += line + '\n'
      if (trimmed.includes('$$')) {
        inDollar = false
        if (trimmed.includes(';')) {
          const stmt = current.trim()
          if (stmt) out.push(stmt)
          current = ''
        }
      }
      continue
    }
    current += line + '\n'
  }
  if (current.trim()) out.push(current.trim())
  return out.filter((s) => s && s.trim().length > 0)
}

async function main() {
  const schema = readFileSync(schemaPath, 'utf8')
  const statements = splitStatements(schema)
  console.log(`Running ${statements.length} statement(s) from neon/schema.sql ...`)
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i]
    try {
      await sql.query(stmt, [])
      console.log(`  OK ${i + 1}/${statements.length}`)
    } catch (err) {
      if (err.message && (err.message.includes('already exists') || err.message.includes('duplicate key'))) {
        console.log(`  SKIP ${i + 1}/${statements.length} (already exists)`)
      } else {
        console.error(`  FAIL ${i + 1}/${statements.length}:`, err.message)
        throw err
      }
    }
  }
  console.log('Schema applied successfully.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
