import * as readline from 'node:readline'
import chalk from 'chalk'
import { getFanService } from '../fans'
import {
  getRandomPPVOffer,
  getAllPPVs,
  getPPVById,
  getFanPurchases,
  hasFanPurchased,
  getFollowUpCTA,
} from '../ppv'
import { getPersona, PHASE_NAMES } from '../persona'
import { createConversationEngine } from '../chat'
import type { FanProfile } from '../fans'
import type { ConversationState } from '../chat'

export interface CLIContext {
  currentFanId: string | null
  currentFan: FanProfile | null
  conversationState: ConversationState | null
}

export class ChatBotCLI {
  private rl: readline.Interface | null = null
  private readonly fanService = getFanService()
  private readonly persona = getPersona()
  private readonly conversationEngine = createConversationEngine()
  private context: CLIContext = {
    currentFanId: null,
    currentFan: null,
    conversationState: null,
  }

  /**
   * Start the CLI
   */
  start(): void {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '\n> ',
    })

    this.showWelcome()

    this.rl?.on('line', async (input) => {
      await this.handleInput(input.trim())
      this.rl?.prompt()
    })

    this.rl?.on('close', () => {
      this.showGoodbye()
    })

    this.rl?.prompt()
  }

  /**
   * Show welcome message
   */
  private showWelcome(): void {
    console.log('')
    console.log(chalk.magenta('╔══════════════════════════════════════╗'))
    console.log(chalk.magenta('║') + chalk.cyan('  🤖 OF Chatbot v1.0                  ') + chalk.magenta('║'))
    console.log(chalk.magenta('║') + chalk.gray(`  Persona: ${this.persona.name} (${this.persona.age})        `).padEnd(39) + chalk.magenta('║'))
    console.log(chalk.magenta('╚══════════════════════════════════════╝'))
    console.log('')
    console.log(chalk.gray('Type /help for available commands'))
    console.log('')
  }

  /**
   * Show goodbye message
   */
  private showGoodbye(): void {
    console.log('')
    console.log(chalk.magenta('Goodbye! 👋'))
    console.log('')
  }

  /**
   * Handle user input
   */
  private async handleInput(input: string): Promise<void> {
    if (!input) {
      return
    }

    if (input.startsWith('/')) {
      await this.handleCommand(input)
      return
    }

    if (this.context.conversationState) {
      await this.handleConversation(input)
      return
    }

    console.log(chalk.gray('Type /help for commands or /chat <fan_id> to start'))
  }

  /**
   * Handle slash commands
   */
  private async handleCommand(input: string): Promise<void> {
    const parts = input.split(/\s+/)
    const command = parts[0]?.toLowerCase()
    const args = parts.slice(1)

    switch (command) {
      case '/help':
        this.showHelp()
        break
      case '/chat':
        await this.cmdChat(args)
        break
      case '/fans':
        this.cmdFans()
        break
      case '/ppv':
        this.cmdPPV()
        break
      case '/profile':
        this.cmdProfile(args)
        break
      case '/score':
        this.cmdScore(args)
        break
      case '/stats':
        this.cmdStats()
        break
      case '/quit':
      case '/exit':
        this.rl?.close()
        break
      default:
        console.log(chalk.red(`Unknown command: ${command}`))
    }
  }

  /**
   * Show help
   */
  private showHelp(): void {
    console.log('')
    console.log(chalk.cyan('Commands:'))
    console.log(chalk.white('  /chat <id>') + chalk.gray('  - Start conversation with fan'))
    console.log(chalk.white('  /chat new <name>') + chalk.gray(' - Create new fan'))
    console.log(chalk.white('  /fans') + chalk.gray('  - List all fans'))
    console.log(chalk.white('  /ppv') + chalk.gray('  - List PPV scripts'))
    console.log(chalk.white('  /profile <id>') + chalk.gray(' - Show fan profile'))
    console.log(chalk.white('  /score <id>') + chalk.gray(' - Show score breakdown'))
    console.log(chalk.white('  /stats') + chalk.gray('  - Show statistics'))
    console.log(chalk.white('  /quit') + chalk.gray('  - Exit'))
    console.log('')
  }

  /**
   * /chat command
   */
  private async cmdChat(args: string[]): Promise<void> {
    if (args.length === 0) {
      console.log(chalk.red('Usage: /chat <fan_id> or /chat new <name>'))
      return
    }

    if (args[0] === 'new') {
      const name = args.slice(1).join(' ')
      if (!name) {
        console.log(chalk.red('Please provide a name'))
        return
      }

      const fan = this.fanService.getOrCreateFan(name)
      this.startConversation(fan)
    } else {
      const fanId = args[0]
      if (!fanId) {
        console.log(chalk.red('Please provide a fan ID'))
        return
      }

      const fan = this.fanService.getFanById(fanId)
      if (!fan) {
        console.log(chalk.red(`Fan not found: ${fanId}`))
        return
      }

      this.startConversation(fan)
    }
  }

  /**
   * Start conversation
   */
  private startConversation(fan: FanProfile): void {
    this.context.currentFanId = fan.id
    this.context.currentFan = fan
    this.context.conversationState = this.conversationEngine.createState(fan.id, fan.name)

    console.log('')
    console.log(chalk.cyan(`═╡ Conversation with ${fan.name} ╞═`))
    console.log(chalk.gray(`Phase: ${PHASE_NAMES[fan.currentPhase as 1 | 2 | 3 | 4]} | Score: ${fan.engagementScore}`))
    console.log('')

    const greeting = this.getGreeting(fan.name)
    console.log(chalk.magenta(`${this.persona.name}:`))
    for (const line of greeting) {
      console.log(chalk.white(`  ${line}`))
    }
  }

  /**
   * Get greeting messages
   */
  private getGreeting(fanName: string): string[] {
    const greetings = [
      [`heyy ${fanName}! 🥰`, "omg I've been scrolling Netflix for like an hour...", 'what are you up to?'],
      [`hey ${fanName}!`, "I just got back from the beach and I'm literally SO sunburnt 😭", "how's your day?"],
      [`hii ${fanName} ✨`, "I've been so bored today, help entertain me?", 'what are you up to?'],
    ]

    return greetings[Math.floor(Math.random() * greetings.length)]!
  }

  /**
   * Handle conversation message
   */
  private async handleConversation(message: string): Promise<void> {
    if (!this.context.conversationState || !this.context.currentFan) {
      return
    }

    try {
      const response = await this.conversationEngine.processFanMessage(
        this.context.conversationState,
        message
      )

      // Update state
      this.context.conversationState = {
        ...this.context.conversationState,
        phase: response.newPhase,
        engagementScore: response.newScore,
        messages: response.updatedConversationMessages,
        lastFanMessageAt: new Date(),
      }

      // Update fan
      this.fanService.updateFanScore(this.context.currentFan.id, response.newScore)
      this.fanService.updateFanPhase(this.context.currentFan.id, response.newPhase)
      this.fanService.updateFanPowerDynamic(this.context.currentFan.id, response.powerDynamic)

      // Show response
      console.log('')
      console.log(chalk.magenta(`${this.persona.name}:`))
      for (const line of response.messages) {
        console.log(chalk.white(`  ${line}`))
      }

      if (response.shouldOfferPPV) {
        console.log('')
        console.log(chalk.gray('[💡 PPV opportunity - use /ppv to offer]'))
      }
    } catch (error) {
      console.log(chalk.red('Error processing message'))
      if (error instanceof Error) {
        console.log(chalk.gray(error.message))
      }
    }
  }

  /**
   * /fans command
   */
  private cmdFans(): void {
    const fans = this.fanService.getAllFans()

    if (fans.length === 0) {
      console.log(chalk.gray('No fans found'))
      return
    }

    console.log('')
    console.log(chalk.cyan(`Fans (${fans.length}):`))

    for (const fan of fans) {
      const phaseEmoji = { 1: '👋', 2: '😏', 3: '🔥', 4: '💰' }
      const emoji = phaseEmoji[fan.currentPhase as keyof typeof phaseEmoji] ?? '❓'
      console.log(`${emoji} ${fan.name.padEnd(15)} Phase ${fan.currentPhase}  Score: ${fan.engagementScore}`)
    }
  }

  /**
   * /ppv command
   */
  private cmdPPV(): void {
    const ppvs = getAllPPVs()

    if (ppvs.length === 0) {
      console.log(chalk.gray('No PPV scripts available'))
      return
    }

    console.log('')
    console.log(chalk.cyan(`PPV Scripts (${ppvs.length}):`))

    for (const ppv of ppvs) {
      const price = `$${(ppv.price / 100).toFixed(2)}`
      console.log(chalk.white(`  ${ppv.id.slice(0, 8)}... `) + chalk.cyan(ppv.title) + chalk.gray(` - ${price}`))
    }
  }

  /**
   * /profile command
   */
  private cmdProfile(args: string[]): void {
    const fanId = args[0] ?? this.context.currentFanId

    if (!fanId) {
      console.log(chalk.red('Usage: /profile <fan_id>'))
      return
    }

    const fan = this.fanService.getFanById(fanId)
    if (!fan) {
      console.log(chalk.red(`Fan not found: ${fanId}`))
      return
    }

    console.log('')
    console.log(this.fanService.formatFanProfile(fan))
  }

  /**
   * /score command
   */
  private cmdScore(args: string[]): void {
    const fanId = args[0] ?? this.context.currentFanId

    if (!fanId) {
      console.log(chalk.red('Usage: /score <fan_id>'))
      return
    }

    const fan = this.fanService.getFanById(fanId)
    if (!fan) {
      console.log(chalk.red(`Fan not found: ${fanId}`))
      return
    }

    console.log('')
    console.log(chalk.cyan(`Score for ${fan.name}:`))
    console.log(chalk.white(`  Phase: `) + chalk.yellow(PHASE_NAMES[fan.currentPhase as 1 | 2 | 3 | 4]))
    console.log(chalk.white(`  Score: `) + chalk.yellow(`${fan.engagementScore}/100`))
    console.log(chalk.white(`  Dynamic: `) + chalk.yellow(fan.powerDynamic))
  }

  /**
   * /stats command
   */
  private cmdStats(): void {
    const stats = this.fanService.getStats()

    console.log('')
    console.log(chalk.cyan('Statistics:'))
    console.log(chalk.white(`  Total Fans: `) + chalk.yellow(stats.totalFans.toString()))
    console.log(chalk.white(`  Avg Engagement: `) + chalk.yellow(`${stats.averageEngagement}/100`))
    console.log('')
    console.log(chalk.cyan('By Phase:'))
    console.log(chalk.white(`  Phase 1: `) + chalk.yellow(stats.fansByPhase['1']?.toString() ?? '0'))
    console.log(chalk.white(`  Phase 2: `) + chalk.yellow(stats.fansByPhase['2']?.toString() ?? '0'))
    console.log(chalk.white(`  Phase 3: `) + chalk.yellow(stats.fansByPhase['3']?.toString() ?? '0'))
    console.log(chalk.white(`  Phase 4: `) + chalk.yellow(stats.fansByPhase['4']?.toString() ?? '0'))
  }
}

// Singleton
let cli: ChatBotCLI | null = null

export function getCLI(): ChatBotCLI {
  if (!cli) {
    cli = new ChatBotCLI()
  }
  return cli
}

export function resetCLI(): void {
  cli = null
}
