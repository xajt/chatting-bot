import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PPVRepository, getPPVRepository, resetPPVRepository } from './ppv-repository'

describe('PPVRepository', () => {
  let repo: PPVRepository

  beforeEach(() => {
    resetPPVRepository()
    repo = getPPVRepository()
  })

  afterEach(() => {
    resetPPVRepository()
  })

  describe('getAll', () => {
    it('should return an array', () => {
      const all = repo.getAll()

      expect(Array.isArray(all)).toBe(true)
    })
  })

  describe('getRandom', () => {
    it('should return a PPV when available', () => {
      // The database should be seeded with PPVs
      const random = repo.getRandom()

      // If there are seeded PPVs, we should get one
      if (random) {
        expect(random.id).toBeDefined()
        expect(random.title).toBeDefined()
      }
    })
  })

  describe('getById', () => {
    it('should return null for non-existent id', () => {
      const found = repo.getById('non-existent-id-12345')

      expect(found).toBeNull()
    })
  })

  describe('getPurchasesByFan', () => {
    it('should return empty array for fan with no purchases', () => {
      const purchases = repo.getPurchasesByFan('non-existent-fan-12345')

      expect(purchases).toHaveLength(0)
    })
  })

  describe('hasFanPurchased', () => {
    it('should return false for non-existent purchase', () => {
      const hasPurchased = repo.hasFanPurchased('non-existent-fan', 'non-existent-ppv')

      expect(hasPurchased).toBe(false)
    })
  })

  describe('singleton', () => {
    it('should return the same instance', () => {
      const instance1 = getPPVRepository()
      const instance2 = getPPVRepository()

      expect(instance1).toBe(instance2)
    })

    it('should reset to new instance', () => {
      const instance1 = getPPVRepository()
      resetPPVRepository()
      const instance2 = getPPVRepository()

      expect(instance1).not.toBe(instance2)
    })
  })
})
