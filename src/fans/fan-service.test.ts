import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { FanService, getFanService, resetFanService } from './fan-service'

describe('FanService', () => {
  let service: FanService

  beforeEach(() => {
    resetFanService()
    service = getFanService()
  })

  afterEach(() => {
    resetFanService()
  })

  describe('formatFanProfile', () => {
    it('should format fan profile correctly', () => {
      const fan = {
        id: 'test-id',
        name: 'John',
        nickname: 'Johnny',
        currentPhase: 2,
        engagementScore: 50,
        powerDynamic: 'dominant' as const,
        preferences: ['sports', 'music'],
        discountsOffered: ['ppv-1'],
        notes: 'VIP fan',
        lastMessageAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const formatted = service.formatFanProfile(fan)

      expect(formatted).toContain('John')
      expect(formatted).toContain('Johnny')
      expect(formatted).toContain('50')
      expect(formatted).toContain('sports')
    })
  })

  describe('formatFanSummary', () => {
    it('should format fan summary correctly', () => {
      const summary = {
        id: 'test-id',
        name: 'John',
        currentPhase: 3,
        engagementScore: 75,
        totalPurchases: 2,
        lastMessageAt: new Date(),
      }

      const formatted = service.formatFanSummary(summary)

      expect(formatted).toContain('John')
      expect(formatted).toContain('75')
    })
  })

  describe('getStats', () => {
    it('should return stats object', () => {
      const stats = service.getStats()

      expect(stats).toHaveProperty('totalFans')
      expect(stats).toHaveProperty('averageEngagement')
      expect(stats).toHaveProperty('fansByPhase')
      expect(stats).toHaveProperty('fansByDynamic')
    })
  })

  describe('searchFans', () => {
    it('should return empty array for empty query', () => {
      const results = service.searchFans('')

      expect(results).toHaveLength(0)
    })

    it('should return empty array for whitespace query', () => {
      const results = service.searchFans('   ')

      expect(results).toHaveLength(0)
    })
  })

  describe('getFansByPhase', () => {
    it('should return array', () => {
      const fans = service.getFansByPhase(1)

      expect(Array.isArray(fans)).toBe(true)
    })
  })

  describe('getFansByDynamic', () => {
    it('should return array', () => {
      const fans = service.getFansByDynamic('neutral')

      expect(Array.isArray(fans)).toBe(true)
    })
  })

  describe('getHighEngagementFans', () => {
    it('should return array', () => {
      const fans = service.getHighEngagementFans()

      expect(Array.isArray(fans)).toBe(true)
    })
  })

  describe('singleton', () => {
    it('should return the same instance', () => {
      const instance1 = getFanService()
      const instance2 = getFanService()

      expect(instance1).toBe(instance2)
    })

    it('should reset to new instance', () => {
      const instance1 = getFanService()
      resetFanService()
      const instance2 = getFanService()

      expect(instance1).not.toBe(instance2)
    })
  })
})
