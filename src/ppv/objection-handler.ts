import { getDeepseekClient } from '../api/deepseek-client'
import type { ChatMessage } from '../api/types'

export type ObjectionType = 'price_objection' | 'not_interested' | 'maybe_later' | 'other'

export interface ObjectionResult {
  type: ObjectionType
  confidence: number
  response: string
  shouldOfferDiscount: boolean
}

export interface HandleObjectionResult {
  type: ObjectionType
  response: string
  shouldOfferDiscount: boolean
}

const OBJECTION_RESPONSES: Record<ObjectionType, string[]> = {
  price_objection: [
    'honestly... you\'ve been so fun to talk to',
    'let me do $X instead 🥺',
    'just between us, okay?',
  ],

  not_interested: ['no worries babe 😘', 'totally get it', 'we can just keep chatting'],

  maybe_later: [
    'no stress! just let me know whenever',
    'I\'ll be here 😏',
    'the offer stands whenever you\'re ready',
  ],

  other: ['no worries at all!', "I'm just happy we're chatting", 'you\'re still my favorite 😊'],
}

/**
 * Objection Handler classifies fan objections and generates appropriate responses.
 */
export class ObjectionHandler {
  private readonly client = getDeepseekClient()

  /**
   * Classify objection type from fan's message
   */
  async classifyObjection(fanMessage: string): Promise<ObjectionType> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `Classify this fan's response to a PPV offer into exactly one category:
- price_objection: They mention it's too expensive, too much money, can't afford it
- not_interested: They're not interested in the content type or aren't into it
- maybe_later: They want to buy later, need to think about it, or are unsure
- other: Any other response

Reply with ONLY the category name, nothing else.`,
      },
      {
        role: 'user',
        content: fanMessage,
      },
    ]

    try {
      const response = await this.client.chat(messages, {
        temperature: 0.1,
        maxTokens: 20,
      })

      const classification = response.trim().toLowerCase() as ObjectionType

      if (
        classification === 'price_objection' ||
        classification === 'not_interested' ||
        classification === 'maybe_later' ||
        classification === 'other'
      ) {
        return classification
      }

      return 'other'
    } catch {
      return this.fallbackClassification(fanMessage)
    }
  }

  /**
   * Fallback classification using keywords
   */
  private fallbackClassification(message: string): ObjectionType {
    const lower = message.toLowerCase()

    const priceKeywords = [
      'expensive',
      'too much',
      "can't afford",
      'price',
      'cost',
      'money',
      'budget',
    ]
    const notInterestedKeywords = [
      'not interested',
      'not my thing',
      "don't want",
      'no thanks',
      'pass',
    ]
    const maybeLaterKeywords = ['later', 'maybe', 'think about', 'not now', 'next time']

    if (priceKeywords.some((k) => lower.includes(k))) {
      return 'price_objection'
    }

    if (notInterestedKeywords.some((k) => lower.includes(k))) {
      return 'not_interested'
    }

    if (maybeLaterKeywords.some((k) => lower.includes(k))) {
      return 'maybe_later'
    }

    return 'other'
  }

  /**
   * Get response for an objection type
   */
  getResponse(type: ObjectionType, discountedPrice?: number): string[] {
    let templates = OBJECTION_RESPONSES[type]

    if (type === 'price_objection' && discountedPrice) {
      templates = templates.map((t) => t.replace('$X', `$${discountedPrice}`))
    }

    return templates
  }

  /**
   * Handle objection end-to-end (used by ObjectionHandler internally)
   */
  async handleObjectionInternal(
    fanMessage: string,
    originalPrice: number,
    discountAvailable: boolean
  ): Promise<ObjectionResult> {
    const type = await this.classifyObjection(fanMessage)

    const shouldOfferDiscount = type === 'price_objection' && discountAvailable
    const discountedPrice = shouldOfferDiscount ? Math.round(originalPrice * 0.85) : undefined

    const response = this.getResponse(type, discountedPrice)

    return {
      type,
      confidence: 0.85,
      response: response.join('\n'),
      shouldOfferDiscount,
    }
  }
}

// Singleton instance
let objectionHandler: ObjectionHandler | null = null

export function getObjectionHandler(): ObjectionHandler {
  if (!objectionHandler) {
    objectionHandler = new ObjectionHandler()
  }
  return objectionHandler
}

export function resetObjectionHandler(): void {
  objectionHandler = null
}
