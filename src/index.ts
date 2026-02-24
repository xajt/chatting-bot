import * as dotenv from 'dotenv'
import * as path from 'node:path'
import * as readline from 'node:readline'

// Load environment variables first
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

import { getDeepseekClient, resetDeepseekClient } from './api/deepseek-client'
import { runMigrations } from './db/migrations'
import { runSeed } from './db/seed'
import { createConversationEngine, type ConversationState } from './chat'
import { getPersona, PHASE_NAMES, type Phase } from './persona'

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

    case 'test:chat':
      await testConversation()
      break

    case 'dev':
    default:
      await startInteractiveCLI()
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

  const state: ConversationState = {
    fanId: 'test-fan',
    fanName: 'Tom',
    phase: 1,
    engagementScore: 0,
    scoreBreakdown: {
      total: 0,
      messageCount: 0,
      sexualKeywords: 0,
      responseTime: 0,
      purchaseHistory: 0,
      sentiment: 0,
    },
    powerDynamic: 'neutral',
    messages: [],
    lastFanMessageAt: null,
  }

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

    // Update state
    currentState = {
      ...currentState,
      phase: response.newPhase,
      engagementScore: response.newScore,
      scoreBreakdown: response.scoreBreakdown,
      powerDynamic: response.powerDynamic,
      lastFanMessageAt: new Date(),
    }

    if (response.shouldOfferPPV) {
      console.log('\n[💡 Should offer PPV now!]')
    }
  }

  console.log('\n✅ Conversation test complete!')
}

async function startInteractiveCLI(): Promise<void> {
  console.log('🤖 OF Chatbot v1.0')
  console.log('')
  console.log('Interactive Chat Mode')
  console.log('Type your message and press Enter to chat.')
  console.log('Type /quit to exit.')
  console.log('')

  const persona = getPersona()
  console.log(`Persona: ${persona.name}\n`)

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  const engine = createConversationEngine()

  const state: ConversationState = {
    fanId: 'interactive-fan',
    fanName: 'You',
    phase: 1,
    engagementScore: 0,
    scoreBreakdown: {
      total: 0,
      messageCount: 0,
      sexualKeywords: 0,
      responseTime: 0,
      purchaseHistory: 0,
      sentiment: 0,
    },
    powerDynamic: 'neutral',
    messages: [],
    lastFanMessageAt: null,
  }

  let currentState = state

  const prompt = (): void => {
    rl.question('\n> ', async (input) => {
      const trimmed = input.trim()

      if (trimmed === '/quit' || trimmed === '/exit') {
        console.log('\nGoodbye! 👋')
        rl.close()
        return
      }

      if (!trimmed) {
        prompt()
        return
      }

      try {
        const response = await engine.processFanMessage(currentState, trimmed)

        console.log(`\n[Phase: ${PHASE_NAMES[response.newPhase]}] [Score: ${response.newScore}]`)

        console.log(`\n${persona.name}:`)
        for (const line of response.messages) {
          console.log(`  ${line}`)
        }

        if (response.shouldOfferPPV) {
          console.log('\n[💡 PPV opportunity detected]')
        }

        // Update state
        currentState = {
          ...currentState,
          phase: response.newPhase,
          engagementScore: response.newScore,
          scoreBreakdown: response.scoreBreakdown,
          powerDynamic: response.powerDynamic,
          lastFanMessageAt: new Date(),
        }
      } catch (error) {
        console.error('\n❌ Error:', error instanceof Error ? error.message : error)
      }

      prompt()
    })
  }

  // Send initial greeting
  console.log(`${persona.name}:`)
  console.log(`  heyy! 🥰`)
  console.log(`  omg I've been scrolling Netflix for like an hour and I swear I've seen everything...`)
  console.log(`  what are you up to? I need distraction from my indecisiveness haha`)

  prompt()
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
