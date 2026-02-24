import * as dotenv from 'dotenv'
import * as path from 'node:path'

// Load environment variables first
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

import { getDeepseekClient, resetDeepseekClient } from './api/deepseek-client'
import { runMigrations } from './db/migrations'
import { runSeed } from './db/seed'

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const command = args[0]

  switch (command) {
    case 'db:init':
      console.log('Initializing database...')
      runMigrations()
      console.log('Database initialized successfully!')
      break

    case 'db:seed':
      console.log('Seeding database...')
      runMigrations()
      runSeed()
      console.log('Database seeded successfully!')
      break

    case 'test:api':
      console.log('Testing Deepseek API connection...')
      try {
        resetDeepseekClient()
        const client = getDeepseekClient()
        const success = await client.testConnection()
        if (success) {
          console.log('✅ Deepseek API connected successfully!')
        } else {
          console.log('❌ Deepseek API connection failed')
          process.exit(1)
        }
      } catch (error) {
        console.error('❌ Deepseek API error:', error instanceof Error ? error.message : error)
        process.exit(1)
      }
      break

    case 'dev':
    default:
      console.log('🤖 OF Chatbot v1.0')
      console.log('')
      console.log('Available commands:')
      console.log('  npm run dev         - Start interactive CLI')
      console.log('  npm run db:init     - Initialize database')
      console.log('  npm run db:seed     - Seed demo data')
      console.log('  npm run test:api    - Test API connection')
      console.log('')
      console.log('First time setup:')
      console.log('  1. cp .env.example .env')
      console.log('  2. Add your DEEPSEEK_API_KEY to .env')
      console.log('  3. npm run db:init')
      console.log('  4. npm run db:seed')
      console.log('  5. npm run dev')
      break
  }
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
