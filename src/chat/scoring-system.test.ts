import { describe, it, expect } from 'vitest'
import {
  calculateScore,
  detectSexualKeywords,
  detectSentiment,
  detectPowerDynamic,
} from './scoring-system'

describe('scoring-system', () => {
  describe('calculateScore', () => {
    it('should return 0 for minimal factors', () => {
      const result = calculateScore({
        messageCount: 0,
        sexualKeywords: [],
        responseTimeMs: 0,
        purchaseCount: 0,
        sentiment: 'neutral',
      })

      expect(result.total).toBe(0)
      expect(result.messageCount).toBe(0)
      expect(result.sexualKeywords).toBe(0)
    })

    it('should calculate message score', () => {
      const result = calculateScore({
        messageCount: 10,
        sexualKeywords: [],
        responseTimeMs: 0,
        purchaseCount: 0,
        sentiment: 'neutral',
      })

      expect(result.messageCount).toBe(10)
    })

    it('should cap message score at 20', () => {
      const result = calculateScore({
        messageCount: 50,
        sexualKeywords: [],
        responseTimeMs: 0,
        purchaseCount: 0,
        sentiment: 'neutral',
      })

      expect(result.messageCount).toBe(20)
    })

    it('should calculate sexual keyword score', () => {
      const result = calculateScore({
        messageCount: 0,
        sexualKeywords: ['nudes', 'horny'],
        responseTimeMs: 0,
        purchaseCount: 0,
        sentiment: 'neutral',
      })

      expect(result.sexualKeywords).toBe(17) // 10 + 7
    })

    it('should calculate response time score for fast response', () => {
      const result = calculateScore({
        messageCount: 0,
        sexualKeywords: [],
        responseTimeMs: 3 * 60 * 1000, // 3 minutes
        purchaseCount: 0,
        sentiment: 'neutral',
      })

      expect(result.responseTime).toBe(10)
    })

    it('should calculate response time score for medium response', () => {
      const result = calculateScore({
        messageCount: 0,
        sexualKeywords: [],
        responseTimeMs: 20 * 60 * 1000, // 20 minutes
        purchaseCount: 0,
        sentiment: 'neutral',
      })

      expect(result.responseTime).toBe(5)
    })

    it('should calculate purchase score', () => {
      const result = calculateScore({
        messageCount: 0,
        sexualKeywords: [],
        responseTimeMs: 0,
        purchaseCount: 2,
        sentiment: 'neutral',
      })

      expect(result.purchaseHistory).toBe(40)
    })

    it('should cap purchase score at 40', () => {
      const result = calculateScore({
        messageCount: 0,
        sexualKeywords: [],
        responseTimeMs: 0,
        purchaseCount: 10,
        sentiment: 'neutral',
      })

      expect(result.purchaseHistory).toBe(40)
    })

    it('should calculate positive sentiment score', () => {
      const result = calculateScore({
        messageCount: 0,
        sexualKeywords: [],
        responseTimeMs: 0,
        purchaseCount: 0,
        sentiment: 'positive',
      })

      expect(result.sentiment).toBe(5)
    })

    it('should calculate very positive sentiment score', () => {
      const result = calculateScore({
        messageCount: 0,
        sexualKeywords: [],
        responseTimeMs: 0,
        purchaseCount: 0,
        sentiment: 'very_positive',
      })

      expect(result.sentiment).toBe(10)
    })

    it('should calculate negative sentiment score', () => {
      const result = calculateScore({
        messageCount: 0,
        sexualKeywords: [],
        responseTimeMs: 0,
        purchaseCount: 0,
        sentiment: 'negative',
      })

      expect(result.sentiment).toBe(-5)
    })

    it('should cap total at 100', () => {
      const result = calculateScore({
        messageCount: 50,
        sexualKeywords: ['nudes', 'cum', 'cock', 'fuck'],
        responseTimeMs: 1000,
        purchaseCount: 10,
        sentiment: 'very_positive',
      })

      expect(result.total).toBeLessThanOrEqual(100)
    })

    it('should not go below 0', () => {
      const result = calculateScore({
        messageCount: 0,
        sexualKeywords: [],
        responseTimeMs: 0,
        purchaseCount: 0,
        sentiment: 'negative',
      })

      expect(result.total).toBeGreaterThanOrEqual(0)
    })
  })

  describe('detectSexualKeywords', () => {
    it('should detect single sexual keywords', () => {
      const keywords = detectSexualKeywords('I want to see you naked')

      expect(keywords).toContain('naked')
    })

    it('should detect multiple sexual keywords', () => {
      const keywords = detectSexualKeywords('I want nudes and I am horny')

      expect(keywords).toContain('nudes')
      expect(keywords).toContain('horny')
    })

    it('should detect multi-word phrases', () => {
      const keywords = detectSexualKeywords('I want to touch myself')

      expect(keywords).toContain('touch myself')
    })

    it('should use word boundary matching', () => {
      // 'sex' should not match 'sexy'
      const keywords = detectSexualKeywords('you are so sexy')

      expect(keywords).not.toContain('sex')
    })

    it('should return empty array for no keywords', () => {
      const keywords = detectSexualKeywords('hello how are you')

      expect(keywords).toHaveLength(0)
    })
  })

  describe('detectSentiment', () => {
    it('should detect positive sentiment', () => {
      const sentiment = detectSentiment('I love this!')

      expect(sentiment).toBe('positive')
    })

    it('should detect very positive sentiment', () => {
      const sentiment = detectSentiment('This is absolutely amazing and wonderful and I love it!')

      expect(sentiment).toBe('very_positive')
    })

    it('should detect neutral sentiment', () => {
      const sentiment = detectSentiment('the weather is cloudy')

      expect(sentiment).toBe('neutral')
    })

    it('should detect negative sentiment', () => {
      const sentiment = detectSentiment('no I hate this stop it leave me alone block')

      expect(sentiment).toBe('negative')
    })

    it('should handle emoji', () => {
      const sentiment = detectSentiment('😍🥰😘💕')

      expect(sentiment).toBe('very_positive')
    })
  })

  describe('detectPowerDynamic', () => {
    it('should detect submissive dynamic', () => {
      const dynamic = detectPowerDynamic(['was that good?', 'did i do it right?'])

      expect(dynamic).toBe('submissive')
    })

    it('should detect dominant dynamic', () => {
      const dynamic = detectPowerDynamic(['do it now', 'you will prove it'])

      expect(dynamic).toBe('dominant')
    })

    it('should detect neutral dynamic', () => {
      const dynamic = detectPowerDynamic(['hello', 'how are you'])

      expect(dynamic).toBe('neutral')
    })
  })
})
