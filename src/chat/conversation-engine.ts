import { randomUUID } from 'node:crypto'
import { getDeepseekClient, type ChatMessage } from '../api/deepseek-client'
import { getPersona, buildPersonaSystemPrompt } from '../persona/persona-loader'
import {
  type Phase,
  type PowerDynamic,
  PHASE_NAMES,
  PHASE_THRESHOLDS,
  MIN_MESSAGES_PER_PHASE,
  SEXUAL_KEYWORDS,
} from '../persona/persona-types'
import {
  calculateScore,
  detectSexualKeywords,
  detectSentiment,
  detectPowerDynamic,
  type ScoringFactors,
  type ScoreBreakdown,
} from './scoring-system'
import {
  buildContextWindow,
  formatContextForLLM,
  type ConversationMessage,
  type ContextWindow,
} from './context-builder'
import { getPPVRepository } from '../ppv/ppv-repository'

export interface ConversationState {
  fanId: string
  fanName: string
  phase: Phase
  engagementScore: number
  scoreBreakdown: ScoreBreakdown
  powerDynamic: PowerDynamic
  messages: ConversationMessage[]
  lastFanMessageAt: Date | null
}

export interface PPVOffer {
  id: string
  title: string
  contentText: string
  price: number
  previewText?: string
}

export interface BotResponse {
  messages: string[]
  updatedConversationMessages: ConversationMessage[]
  newPhase: Phase
  newScore: number
  scoreBreakdown: ScoreBreakdown
  powerDynamic: PowerDynamic
  shouldOfferPPV: boolean
  ppvOffer?: PPVOffer
}

export class ConversationEngine {
  private readonly client = getDeepseekClient()
  private readonly persona = getPersona()

  /**
   * Create initial conversation state for a fan
   */
  createState(fanId: string, fanName: string): ConversationState {
    return {
      fanId,
      fanName,
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
  }

  async processFanMessage(
    state: ConversationState,
    fanMessage: string
  ): Promise<BotResponse> {
    const now = new Date()

    // Calculate response time
    const responseTimeMs = state.lastFanMessageAt
      ? now.getTime() - state.lastFanMessageAt.getTime()
      : 0

    // Detect sexual keywords from current message
    const currentKeywords = detectSexualKeywords(fanMessage)

    // Collect all sexual keywords from conversation history
    const allKeywords: string[] = []
    for (const msg of state.messages) {
      if (msg.role === 'fan') {
        allKeywords.push(...detectSexualKeywords(msg.content))
      }
    }
    // Add current message keywords
    allKeywords.push(...currentKeywords)

    // Detect sentiment from current message
    const sentiment = detectSentiment(fanMessage)

    // Get purchase count (would come from fan service in real implementation)
    const purchaseCount = 0 // TODO: Get from fan profile

    // Calculate new score with accumulated keywords
    const scoreBreakdown = calculateScore({
      messageCount: state.messages.filter((m) => m.role === 'fan').length + 1,
      sexualKeywords: allKeywords,
      responseTimeMs,
      purchaseCount,
      sentiment,
    })

    // Check for phase acceleration (explicit content)
    const hasExplicitContent = currentKeywords.length > 0
    let newPhase = state.phase

    if (hasExplicitContent && state.phase < 3) {
      // Jump to phase 3 or 4 if explicit content detected
      newPhase = currentKeywords.length >= 3 ? 4 : 3
    } else {
      // Normal phase progression
      newPhase = this.calculatePhaseTransition(state, scoreBreakdown.total)
    }

    // Add fan message to history
    const fanMsg: ConversationMessage = {
      id: randomUUID(),
      role: 'fan',
      content: fanMessage,
      phase: state.phase,
      scoreAtMessage: scoreBreakdown.total,
      createdAt: now,
    }

    const updatedMessages = [...state.messages, fanMsg]

    // Detect power dynamic from recent messages
    const recentFanMessages = updatedMessages
      .filter((m) => m.role === 'fan')
      .slice(-5)
      .map((m) => m.content)
    const powerDynamic = detectPowerDynamic(recentFanMessages)

    // Build context window
    const contextWindow = buildContextWindow(updatedMessages)

    // Generate response
    const botMessages = await this.generateResponse(
      fanMessage,
      contextWindow,
      newPhase,
      powerDynamic,
      state.fanName
    )

    // Add bot messages to history
    const botMsgs: ConversationMessage[] = botMessages.map((content) => ({
      id: randomUUID(),
      role: 'bot' as const,
      content,
      phase: newPhase,
      scoreAtMessage: scoreBreakdown.total,
      createdAt: new Date(),
    }))

    // Combine all messages for return
    const allUpdatedMessages = [...updatedMessages, ...botMsgs]

    // Determine if we should offer PPV
    const shouldOfferPPV = this.shouldOfferPPV(newPhase, scoreBreakdown.total)

    // Get PPV offer if we should offer one
    let ppvOffer: PPVOffer | undefined
    if (shouldOfferPPV) {
      const ppv = getPPVRepository().getRandom()
      if (ppv) {
        ppvOffer = {
          id: ppv.id,
          title: ppv.title,
          contentText: ppv.contentText,
          price: ppv.price,
          previewText: ppv.previewText,
        }
      }
    }

    const response: BotResponse = {
      messages: botMessages,
      updatedConversationMessages: allUpdatedMessages,
      newPhase,
      newScore: scoreBreakdown.total,
      scoreBreakdown,
      powerDynamic,
      shouldOfferPPV,
    }

    if (ppvOffer) {
      response.ppvOffer = ppvOffer
    }

    return response
  }

  private calculatePhaseTransition(state: ConversationState, newScore: number): Phase {
    const currentPhase = state.phase
    const messagesInPhase = state.messages.filter((m) => m.phase === currentPhase).length

    // Need minimum messages in current phase before transitioning
    if (messagesInPhase < MIN_MESSAGES_PER_PHASE) {
      return currentPhase
    }

    // Check score thresholds
    if (newScore >= PHASE_THRESHOLDS[4] && currentPhase < 4) {
      return 4
    }
    if (newScore >= PHASE_THRESHOLDS[3] && currentPhase < 3) {
      return 3
    }
    if (newScore >= PHASE_THRESHOLDS[2] && currentPhase < 2) {
      return 2
    }

    return currentPhase
  }

  private shouldOfferPPV(phase: Phase, score: number): boolean {
    return phase >= 3 && score >= 60
  }

  private async generateResponse(
    fanMessage: string,
    contextWindow: ContextWindow,
    phase: Phase,
    powerDynamic: PowerDynamic,
    fanName: string
  ): Promise<string[]> {
    const systemPrompt = this.buildSystemPrompt(phase, powerDynamic, fanName)
    const contextMessages = formatContextForLLM(contextWindow)

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...contextMessages,
      { role: 'user', content: fanMessage },
    ]

    const response = await this.client.chat(messages, {
      temperature: 0.85,
      maxTokens: 300,
    })

    // Split response into multiple messages if it contains line breaks
    const lines = response
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    // If single message, try to split into 2-4 shorter messages
    if (lines.length === 1 && lines[0]!.length > 50) {
      return this.splitIntoMessages(lines[0]!)
    }

    return lines
  }

  private buildSystemPrompt(phase: Phase, powerDynamic: PowerDynamic, fanName: string): string {
    const basePrompt = buildPersonaSystemPrompt(this.persona)
    const phaseGuidance = this.getPhaseGuidance(phase)
    const dynamicGuidance = this.getPowerDynamicGuidance(powerDynamic)

    return `${basePrompt}

## Current Phase: ${PHASE_NAMES[phase]}
${phaseGuidance}

## Power Dynamic: ${powerDynamic}
${dynamicGuidance}

## Current Fan
You're talking to ${fanName}. Be personal and engaging.

## CRITICAL Rules
- Send 2-6 short messages (each on a new line) - VARY the number naturally
- Keep each message under 40 words
- STICK TO ONE TOPIC per response - don't jump between topics
- Follow up on what they said - don't introduce random new topics
- Be natural like a real person texting, not a bot trying to entertain
- Don't force conversation - let it flow naturally
- If they give short answers, match their energy
- NEVER ask for feedback or details after sharing content - just accept their reaction
- After they see your content: brief acknowledgment, then continue normal chat
- LIMIT QUESTIONS to max 1 per response - statements > questions
- Don't ask "what about you?" or "what's your favorite..." constantly
- React and comment instead of asking - be more responsive than interrogative`
  }

  private getPhaseGuidance(phase: Phase): string {
    const guidance: Record<Phase, string> = {
      1: `RELAXED small talk - nothing forced.
- Respond to what they say, don't change topics
- Match their energy - if they're brief, be brief
- Share something small about your day ONLY if relevant
- NO questions unless natural follow-up
- Just vibing, getting comfortable`,
      2: `Light flirting - still natural.
- Add subtle playful elements
- Show genuine interest in them
- React to what they share
- Keep it casual, not interview-style`,
      3: `More intimate, building anticipation.
- Be more suggestive naturally
- React to the vibe they're giving
- Can hint at exclusive things if moment feels right
- Let them lead the intensity`,
      4: `Ready to offer PPV naturally.
- Offer content only when moment feels right
- Embed PPV in conversation naturally
- Don't push - make it feel like a treat
- If they're not into it, back off gracefully`,
    }
    return guidance[phase] ?? ''
  }

  private getPowerDynamicGuidance(dynamic: PowerDynamic): string {
    const config = this.persona.power_dynamics[dynamic]
    return `Tone: ${config.tone}
Example phrases: ${config.example_phrases.slice(0, 2).join(', ')}
Use emojis: ${config.emojis.slice(0, 3).join(' ')}`
  }

  private splitIntoMessages(text: string): string[] {
    // Try to split on sentence boundaries
    const sentences = text.match(/[^.!?]+[.!?]+/g)

    if (sentences && sentences.length >= 2) {
      // Randomly decide how many messages (2-5)
      const targetCount = Math.floor(Math.random() * 4) + 2 // 2-5
      const messages: string[] = []
      const groupSize = Math.max(1, Math.ceil(sentences.length / targetCount))

      for (let i = 0; i < sentences.length; i += groupSize) {
        const group = sentences.slice(i, i + groupSize).join(' ')
        if (group.trim()) {
          messages.push(group.trim())
        }
      }

      return messages.length > 0 ? messages : [text]
    }

    return [text]
  }
}

// Factory function
export function createConversationEngine(): ConversationEngine {
  return new ConversationEngine()
}
