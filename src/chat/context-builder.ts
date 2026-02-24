import type { ChatMessage } from '../api/types'

export interface ConversationMessage {
  id: string
  role: 'fan' | 'bot'
  content: string
  phase: number
  scoreAtMessage: number
  createdAt: Date
}

export interface ContextWindow {
  messages: ChatMessage[]
  summary?: string
  totalMessages: number
}

const DEFAULT_WINDOW_SIZE = 20
const SUMMARY_THRESHOLD = 30 // Generate summary when we have more than this many messages

export function buildContextWindow(
  messages: ConversationMessage[],
  windowSize: number = DEFAULT_WINDOW_SIZE
): ContextWindow {
  const totalMessages = messages.length

  if (totalMessages <= windowSize) {
    return {
      messages: messages.map(toChatMessage),
      totalMessages,
    }
  }

  // Get the most recent messages
  const recentMessages = messages.slice(-windowSize)

  // Older messages that need summarization
  const olderMessages = messages.slice(0, -windowSize)

  const summary = olderMessages.length > 0 ? generateSimpleSummary(olderMessages) : undefined

  if (summary) {
    return {
      messages: recentMessages.map(toChatMessage),
      summary,
      totalMessages,
    }
  }

  return {
    messages: recentMessages.map(toChatMessage),
    totalMessages,
  }
}

function toChatMessage(msg: ConversationMessage): ChatMessage {
  return {
    role: msg.role === 'fan' ? 'user' : 'assistant',
    content: msg.content,
  }
}

// Simple summary generation (in production, this would use LLM)
function generateSimpleSummary(messages: ConversationMessage[]): string {
  const fanMessages = messages.filter((m) => m.role === 'fan')
  const botMessages = messages.filter((m) => m.role === 'bot')

  const phases = [...new Set(messages.map((m) => m.phase))]
  const topics = extractTopics(messages.map((m) => m.content))

  return `[Earlier conversation summary: ${fanMessages.length} messages from fan, ${botMessages.length} from bot. Phases: ${phases.join(' → ')}. Topics discussed: ${topics.join(', ')}]`
}

function extractTopics(contents: string[]): string[] {
  const topicKeywords: Record<string, string[]> = {
    'personal life': ['family', 'friend', 'home', 'house', 'pet', 'cat', 'dog'],
    work: ['work', 'job', 'office', 'boss', 'meeting', 'project'],
    entertainment: ['movie', 'netflix', 'show', 'music', 'game', 'watch'],
    fitness: ['gym', 'workout', 'exercise', 'run', 'sport', 'basketball', 'football'],
    food: ['food', 'eat', 'cook', 'restaurant', 'dinner', 'lunch', 'breakfast'],
    travel: ['travel', 'trip', 'vacation', 'flight', 'hotel', 'beach'],
    hobbies: ['hobby', 'interest', 'like', 'love', 'enjoy'],
  }

  const combinedText = contents.join(' ').toLowerCase()
  const foundTopics: string[] = []

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some((kw) => combinedText.includes(kw))) {
      foundTopics.push(topic)
    }
  }

  return foundTopics.slice(0, 5) // Max 5 topics
}

export function formatContextForLLM(context: ContextWindow): ChatMessage[] {
  const messages: ChatMessage[] = []

  if (context.summary) {
    messages.push({
      role: 'system',
      content: context.summary,
    })
  }

  messages.push(...context.messages)

  return messages
}

export function needsSummarization(messages: ConversationMessage[]): boolean {
  return messages.length > SUMMARY_THRESHOLD
}
