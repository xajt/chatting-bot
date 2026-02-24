import * as dotenv from 'dotenv'
import * as path from 'node:path'

// Load environment variables first
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

import { getCLI } from './cli'
import { runMigrations } from './db/migrations'
import { runSeed } from './db/seed'
import { getDeepseekClient, resetDeepseekClient } from './api/deepseek-client'
import { createConversationEngine } from './chat'
import { getPersona, PHASE_NAMES } from './persona'

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const command = args[0]

  switch (command) {
    case 'db:init':
      console.log('Initializing database...')
      runMigrations()
      console.log('✅ Database initialized successfully!')
      break

    case 'db:seed':
      console.log('Seeding database...')
      runMigrations()
      runSeed()
      console.log('✅ Database seeded successfully!')
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

    case 'test:chat':
      await testConversation()
      break

    case 'dev':
    default:
      // Start CLI
      const cli = getCLI()
      cli.start()
      break
  }
}

async function testConversation(): Promise<void> {
  console.log('Testing conversation engine...\n')

  const persona = getPersona()
  console.log(`Persona: ${persona.name} (${persona.age})`)
  console.log(`Location: ${persona.location}`)
  console.log(`Personality: ${persona.personality.join(', ')}\n`)

  const engine = createConversationEngine()

  const state = engine.createState('test-fan', 'Tom')

  const testMessages = [
    'Hey!',
    'Not much, just got home from work',
    "I'm a software engineer",
    'What are you wearing?',
  ]

  let currentState = state

  for (const msg of testMessages) {
    console.log(`\nFan: ${msg}`)

    const response = await engine.processFanMessage(currentState, msg)

    console.log(`\n[Phase: ${PHASE_NAMES[response.newPhase]}] [Score: ${response.newScore}]`)
    console.log(`[Power Dynamic: ${response.powerDynamic}]`)
    console.log(`\n${persona.name}:`)
    for (const line of response.messages) {
      console.log(`  ${line}`)
    }

    currentState = {
      ...currentState,
      phase: response.newPhase,
      engagementScore: response.newScore,
      lastFanMessageAt: new Date(),
    }

    if (response.shouldOfferPPV) {
      console.log('\n[💡 Should offer PPV now!]')
    }
  }

  console.log('\n✅ Conversation test complete!')
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
