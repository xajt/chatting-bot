import { describe, it, expect, beforeEach } from 'vitest'
import {
  DiscountManager,
  getDiscountManager,
  resetDiscountManager,
} from './discount-manager'

describe('DiscountManager', () => {
  let manager: DiscountManager

  beforeEach(() => {
    resetDiscountManager()
    manager = getDiscountManager()
  })

  describe('getDiscountPercentage', () => {
    it('should return 15%', () => {
      expect(manager.getDiscountPercentage()).toBe(15)
    })
  })

  describe('calculateDiscountedPrice', () => {
    it('should calculate 15% discount for $10', () => {
      const result = manager.calculateDiscountedPrice(1000) // $10.00 in cents
      expect(result).toBe(850) // $8.50 in cents
    })

    it('should calculate 15% discount for $20', () => {
      const result = manager.calculateDiscountedPrice(2000) // $20.00 in cents
      expect(result).toBe(1700) // $17.00 in cents
    })

    it('should calculate 15% discount for $100', () => {
      const result = manager.calculateDiscountedPrice(10000) // $100.00 in cents
      expect(result).toBe(8500) // $85.00 in cents
    })

    it('should handle fractional cents by rounding', () => {
      // $33 * 0.85 = $28.05 (no rounding needed)
      const result = manager.calculateDiscountedPrice(3300)
      expect(result).toBe(2805)
    })
  })

  describe('canOfferDiscount', () => {
    it('should return true when discount not yet offered', () => {
      const offeredPPVs: string[] = []
      const result = manager.canOfferDiscount('fan-123', 'ppv-123', offeredPPVs)
      expect(result).toBe(true)
    })

    it('should return false when discount already offered', () => {
      const offeredPPVs = ['ppv-123']
      const result = manager.canOfferDiscount('fan-123', 'ppv-123', offeredPPVs)
      expect(result).toBe(false)
    })

    it('should return true for different PPV even if other discounts offered', () => {
      const offeredPPVs = ['ppv-123', 'ppv-456']
      const result = manager.canOfferDiscount('fan-123', 'ppv-789', offeredPPVs)
      expect(result).toBe(true)
    })
  })

  describe('recordDiscountOffered', () => {
    it('should add PPV ID to discounts offered', () => {
      const current = ['ppv-123']
      const result = manager.recordDiscountOffered('fan-1', 'ppv-456', current)
      expect(result).toContain('ppv-456')
      expect(result).toHaveLength(2)
    })

    it('should not duplicate PPV ID', () => {
      const current = ['ppv-123']
      const result = manager.recordDiscountOffered('fan-1', 'ppv-123', current)
      expect(result).toEqual(['ppv-123'])
    })
  })

  describe('formatDiscountMessage', () => {
    it('should format discount message with discounted price', () => {
      const result = manager.formatDiscountMessage(1000, 'Tom')
      expect(result).toContain('$')
      expect(result).toContain('9') // $9 after 15% discount from $10 (850 cents rounds to $9)
    })
  })

  describe('isDiscountedPrice', () => {
    it('should return true when paid price is less than original', () => {
      expect(manager.isDiscountedPrice(1000, 850)).toBe(true)
    })

    it('should return false when prices are equal', () => {
      expect(manager.isDiscountedPrice(1000, 1000)).toBe(false)
    })

    it('should return false when paid more than original', () => {
      expect(manager.isDiscountedPrice(1000, 1200)).toBe(false)
    })
  })

  describe('calculateSavings', () => {
    it('should calculate savings correctly', () => {
      const result = manager.calculateSavings(1000, 850)
      expect(result).toBe(150)
    })
  })
})
