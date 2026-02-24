import { describe, it, expect } from 'vitest'
import {
  buildContextWindow,
  formatContextForLLM,
  needsSummarization,
  type ConversationMessage,
} from './context-builder'

describe('context-builder', () => {
  const createMessage = (
    id: string,
    role: 'fan' | 'bot',
    content: string,
    phase = 1,
    score = 0
  ): ConversationMessage => ({
    id,
    role,
    content,
    phase,
    scoreAtMessage: score,
    createdAt: new Date(),
  })

  describe('buildContextWindow', () => {
    it('should return all messages when under window size', () => {
      const messages: ConversationMessage[] = [
        createMessage('1', 'fan', 'hello'),
        createMessage('2', 'bot', 'hi there'),
        createMessage('3', 'fan', 'how are you'),
      ]

      const context = buildContextWindow(messages, 20)

      expect(context.messages).toHaveLength(3)
      expect(context.totalMessages).toBe(3)
      expect(context.summary).toBeUndefined()
    })

    it('should truncate to window size when over', () => {
      const messages: ConversationMessage[] = []
      for (let i = 0; i < 30; i++) {
        messages.push(createMessage(`${i}`, i % 2 === 0 ? 'fan' : 'bot', `message ${i}`))
      }

      const context = buildContextWindow(messages, 20)

      expect(context.messages).toHaveLength(20)
      expect(context.totalMessages).toBe(30)
    })

    it('should generate summary for older messages', () => {
      const messages: ConversationMessage[] = []
      for (let i = 0; i < 30; i++) {
        messages.push(createMessage(`${i}`, i % 2 === 0 ? 'fan' : 'bot', `message ${i}`))
      }

      const context = buildContextWindow(messages, 20)

      expect(context.summary).toBeDefined()
      expect(context.summary).toContain('Earlier conversation summary')
    })

    it('should keep most recent messages', () => {
      const messages: ConversationMessage[] = []
      for (let i = 0; i < 25; i++) {
        messages.push(createMessage(`${i}`, i % 2 === 0 ? 'fan' : 'bot', `message ${i}`))
      }

      const context = buildContextWindow(messages, 20)

      // Should contain messages 5-24 (last 20)
      const lastMessage = context.messages[context.messages.length - 1]
      expect(lastMessage?.content).toContain('message 24')
    })
  })

  describe('formatContextForLLM', () => {
    it('should return messages directly without summary', () => {
      const messages: ConversationMessage[] = [
        createMessage('1', 'fan', 'hello'),
        createMessage('2', 'bot', 'hi'),
      ]

      const context = buildContextWindow(messages, 20)
      const formatted = formatContextForLLM(context)

      expect(formatted).toHaveLength(2)
      expect(formatted[0]?.role).toBe('user')
      expect(formatted[1]?.role).toBe('assistant')
    })

    it('should include summary as system message when present', () => {
      const messages: ConversationMessage[] = []
      for (let i = 0; i < 30; i++) {
        messages.push(createMessage(`${i}`, i % 2 === 0 ? 'fan' : 'bot', `message ${i}`))
      }

      const context = buildContextWindow(messages, 20)
      const formatted = formatContextForLLM(context)

      expect(formatted[0]?.role).toBe('system')
      expect(formatted[0]?.content).toContain('Earlier conversation summary')
    })
  })

  describe('needsSummarization', () => {
    it('should return false for under threshold', () => {
      const messages: ConversationMessage[] = []
      for (let i = 0; i < 20; i++) {
        messages.push(createMessage(`${i}`, 'fan', `msg ${i}`))
      }

      expect(needsSummarization(messages)).toBe(false)
    })

    it('should return true for over threshold', () => {
      const messages: ConversationMessage[] = []
      for (let i = 0; i < 35; i++) {
        messages.push(createMessage(`${i}`, 'fan', `msg ${i}`))
      }

      expect(needsSummarization(messages)).toBe(true)
    })
  })

  describe('role mapping', () => {
    it('should map fan to user role', () => {
      const messages = [createMessage('1', 'fan', 'hello')]
      const context = buildContextWindow(messages, 20)

      expect(context.messages[0]?.role).toBe('user')
    })

    it('should map bot to assistant role', () => {
      const messages = [createMessage('1', 'bot', 'hello')]
      const context = buildContextWindow(messages, 20)

      expect(context.messages[0]?.role).toBe('assistant')
    })
  })
})
