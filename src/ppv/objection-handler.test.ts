import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ObjectionHandler, getObjectionHandler, resetObjectionHandler } from './objection-handler'

// Mock the deepseek client
vi.mock('../api/deepseek-client', () => ({
  getDeepseekClient: () => ({
    chat: vi.fn().mockImplementation(async (messages: any[]) => {
      const lastMessage = messages[messages.length - 1]?.content || ''

      // Simple classification based on keywords
      if (lastMessage.includes('expensive') || lastMessage.includes('price') || lastMessage.includes('cost')) {
        return 'price_objection'
      }
      if (lastMessage.includes('not interested') || lastMessage.includes("don't want")) {
        return 'not_interested'
      }
      if (lastMessage.includes('later') || lastMessage.includes('maybe') || lastMessage.includes('next time')) {
        return 'maybe_later'
      }
      return 'other'
    }),
  }),
}))

describe('ObjectionHandler', () => {
  let handler: ObjectionHandler

  beforeEach(() => {
    resetObjectionHandler()
    handler = getObjectionHandler()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('classifyObjection', () => {
    it('should classify price objection', async () => {
      const result = await handler.classifyObjection('that is too expensive')

      expect(result).toBe('price_objection')
    })

    it('should classify not interested', async () => {
      const result = await handler.classifyObjection("I'm not interested in that")

      expect(result).toBe('not_interested')
    })

    it('should classify maybe later', async () => {
      const result = await handler.classifyObjection('maybe next time')

      expect(result).toBe('maybe_later')
    })

    it('should classify other objections', async () => {
      const result = await handler.classifyObjection('I need to think about it')

      expect(result).toBe('other')
    })
  })

  describe('getResponse', () => {
    it('should return response templates for price objection', () => {
      const response = handler.getResponse('price_objection', 850)

      expect(response.length).toBeGreaterThan(0)
      expect(response.some((r) => r.includes('$850'))).toBe(true)
    })

    it('should return response templates for not interested', () => {
      const response = handler.getResponse('not_interested')

      expect(response.length).toBeGreaterThan(0)
      expect(response.some((r) => r.includes('No worries') || r.includes('no worries'))).toBe(true)
    })

    it('should return response templates for maybe later', () => {
      const response = handler.getResponse('maybe_later')

      expect(response.length).toBeGreaterThan(0)
    })

    it('should return response templates for other', () => {
      const response = handler.getResponse('other')

      expect(response.length).toBeGreaterThan(0)
    })
  })

  describe('handleObjectionInternal', () => {
    it('should handle price objection with discount', async () => {
      const result = await handler.handleObjectionInternal('that is too expensive', 1000, true)

      expect(result.type).toBe('price_objection')
      expect(result.shouldOfferDiscount).toBe(true)
      expect(result.response).toBeDefined()
    })

    it('should handle price objection without discount', async () => {
      const result = await handler.handleObjectionInternal('that is too expensive', 1000, false)

      expect(result.type).toBe('price_objection')
      expect(result.shouldOfferDiscount).toBe(false)
    })

    it('should handle not interested', async () => {
      const result = await handler.handleObjectionInternal("I'm not interested", 1000, true)

      expect(result.type).toBe('not_interested')
      expect(result.shouldOfferDiscount).toBe(false)
    })

    it('should handle maybe later', async () => {
      const result = await handler.handleObjectionInternal('maybe next time', 1000, true)

      expect(result.type).toBe('maybe_later')
      expect(result.shouldOfferDiscount).toBe(false)
    })
  })

  describe('singleton', () => {
    it('should return the same instance', () => {
      const instance1 = getObjectionHandler()
      const instance2 = getObjectionHandler()

      expect(instance1).toBe(instance2)
    })

    it('should reset to new instance', () => {
      const instance1 = getObjectionHandler()
      resetObjectionHandler()
      const instance2 = getObjectionHandler()

      expect(instance1).not.toBe(instance2)
    })
  })
})
