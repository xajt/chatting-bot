import { SEXUAL_KEYWORD_SCORES, type PowerDynamic } from '../persona/persona-types'

export interface ScoringFactors {
  messageCount: number
  sexualKeywords: string[]
  responseTimeMs: number
  purchaseCount: number
  sentiment: 'negative' | 'neutral' | 'positive' | 'very_positive'
}

export interface ScoreBreakdown {
  total: number
  messageCount: number
  sexualKeywords: number
  responseTime: number
  purchaseHistory: number
  sentiment: number
}

const MAX_SCORE = 100

export function calculateScore(factors: ScoringFactors): ScoreBreakdown {
  const messageScore = Math.min(factors.messageCount, 20) // +1 per message, max 20

  const keywordScore = factors.sexualKeywords.reduce((sum, keyword) => {
    const normalized = keyword.toLowerCase()
    return sum + (SEXUAL_KEYWORD_SCORES[normalized] ?? 5)
  }, 0)

  let responseTimeScore = 0
  if (factors.responseTimeMs > 0) {
    const minutes = factors.responseTimeMs / 60000
    if (minutes < 5) {
      responseTimeScore = 10
    } else if (minutes < 30) {
      responseTimeScore = 5
    } else if (minutes < 60) {
      responseTimeScore = 2
    }
  }

  const purchaseScore = Math.min(factors.purchaseCount * 20, 40) // +20 per purchase, max 40

  let sentimentScore = 0
  switch (factors.sentiment) {
    case 'very_positive':
      sentimentScore = 10
      break
    case 'positive':
      sentimentScore = 5
      break
    case 'neutral':
      sentimentScore = 0
      break
    case 'negative':
      sentimentScore = -5
      break
  }

  const total = Math.max(
    0,
    Math.min(
      MAX_SCORE,
      messageScore + keywordScore + responseTimeScore + purchaseScore + sentimentScore
    )
  )

  return {
    total,
    messageCount: messageScore,
    sexualKeywords: keywordScore,
    responseTime: responseTimeScore,
    purchaseHistory: purchaseScore,
    sentiment: sentimentScore,
  }
}

export function detectSexualKeywords(text: string): string[] {
  const lowerText = text.toLowerCase()
  const found: string[] = []

  for (const keyword of Object.keys(SEXUAL_KEYWORD_SCORES)) {
    // For multi-word phrases, use includes
    if (keyword.includes(' ')) {
      if (lowerText.includes(keyword)) {
        found.push(keyword)
      }
    } else {
      // For single words, use word boundary matching to avoid false positives
      // e.g., "sex" should not match "sexy"
      const regex = new RegExp(`\\b${keyword}\\b`, 'i')
      if (regex.test(lowerText)) {
        found.push(keyword)
      }
    }
  }

  return found
}

// Simple sentiment detection based on keywords
// In production, this could use an LLM or dedicated sentiment library
const POSITIVE_WORDS = [
  'love',
  'amazing',
  'awesome',
  'great',
  'beautiful',
  'gorgeous',
  'sexy',
  'hot',
  'perfect',
  'wonderful',
  'fantastic',
  'incredible',
  'yes',
  'please',
  'want',
  'need',
  'miss',
  '😍',
  '🥰',
  '😘',
  '💕',
  '❤️',
  '🔥',
  '💯',
]

const NEGATIVE_WORDS = [
  'no',
  "don't",
  'not',
  'never',
  'hate',
  'ugly',
  'bad',
  'stop',
  'leave',
  'block',
  'report',
  'annoying',
  'boring',
  'weird',
  'creepy',
]

export function detectSentiment(text: string): 'negative' | 'neutral' | 'positive' | 'very_positive' {
  const lowerText = text.toLowerCase()

  let positiveCount = 0
  let negativeCount = 0

  for (const word of POSITIVE_WORDS) {
    if (lowerText.includes(word)) {
      positiveCount++
    }
  }

  for (const word of NEGATIVE_WORDS) {
    if (lowerText.includes(word)) {
      negativeCount++
    }
  }

  // Negative sentiment overrides
  if (negativeCount > positiveCount + 1) {
    return 'negative'
  }

  // Very positive = multiple positive indicators
  if (positiveCount >= 3) {
    return 'very_positive'
  }

  if (positiveCount >= 1) {
    return 'positive'
  }

  return 'neutral'
}

export function detectPowerDynamic(messages: string[]): PowerDynamic {
  const recentText = messages.slice(-5).join(' ').toLowerCase()

  // Submissive indicators
  const submissivePhrases = [
    'was that good',
    'did i do it right',
    'i hope you like',
    'am i doing',
    'for you',
    'please',
    '🥺',
  ]

  // Dominant indicators
  const dominantPhrases = [
    'do it now',
    'you will',
    'prove',
    'i want you to',
    'tell me',
    'now.',
    'better be',
  ]

  let submissiveScore = 0
  let dominantScore = 0

  for (const phrase of submissivePhrases) {
    if (recentText.includes(phrase)) {
      submissiveScore++
    }
  }

  for (const phrase of dominantPhrases) {
    if (recentText.includes(phrase)) {
      dominantScore++
    }
  }

  if (dominantScore > submissiveScore) {
    return 'dominant'
  }

  if (submissiveScore > dominantScore) {
    return 'submissive'
  }

  return 'neutral'
}
