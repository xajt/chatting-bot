import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { FanRepository, getFanRepository, resetFanRepository } from './fan-repository'
import { getDatabase } from '../db/database'
import type { CreateFanInput } from './fan-types'

describe('FanRepository', () => {
  let repo: FanRepository

  beforeEach(() => {
    resetFanRepository()
    repo = getFanRepository()

    // Clear the fans table
    const db = getDatabase()
    db.exec('DELETE FROM fans')
  })

  afterEach(() => {
    resetFanRepository()
  })

  describe('create', () => {
    it('should create a new fan', () => {
      const input: CreateFanInput = { name: 'Tom' }
      const fan = repo.create(input)

      expect(fan.id).toBeDefined()
      expect(fan.name).toBe('Tom')
      expect(fan.currentPhase).toBe(1)
      expect(fan.engagementScore).toBe(0)
      expect(fan.powerDynamic).toBe('neutral')
      expect(fan.preferences).toEqual([])
      expect(fan.discountsOffered).toEqual([])
    })

    it('should create a fan with nickname', () => {
      const input: CreateFanInput = { name: 'Thomas', nickname: 'Tom' }
      const fan = repo.create(input)

      expect(fan.name).toBe('Thomas')
      expect(fan.nickname).toBe('Tom')
    })
  })

  describe('getById', () => {
    it('should return fan by ID', () => {
      const created = repo.create({ name: 'Alice' })
      const found = repo.getById(created.id)

      expect(found).toBeDefined()
      expect(found?.name).toBe('Alice')
    })

    it('should return null for non-existent ID', () => {
      const found = repo.getById('non-existent-id')
      expect(found).toBeNull()
    })
  })

  describe('getByName', () => {
    it('should return fan by name (case-insensitive)', () => {
      repo.create({ name: 'Bob' })
      const found = repo.getByName('BOB')

      expect(found).toBeDefined()
      expect(found?.name).toBe('Bob')
    })

    it('should return null for non-existent name', () => {
      const found = repo.getByName('NonExistent')
      expect(found).toBeNull()
    })
  })

  describe('getAll', () => {
    it('should return all fans', () => {
      repo.create({ name: 'Fan1' })
      repo.create({ name: 'Fan2' })
      repo.create({ name: 'Fan3' })

      const fans = repo.getAll()
      expect(fans).toHaveLength(3)
    })

    it('should return empty array when no fans', () => {
      const fans = repo.getAll()
      expect(fans).toEqual([])
    })
  })

  describe('update', () => {
    it('should update fan name', () => {
      const created = repo.create({ name: 'OldName' })
      const updated = repo.update(created.id, { name: 'NewName' })

      expect(updated?.name).toBe('NewName')
    })

    it('should update fan phase', () => {
      const created = repo.create({ name: 'Test' })
      const updated = repo.update(created.id, { currentPhase: 3 })

      expect(updated?.currentPhase).toBe(3)
    })

    it('should update fan engagement score', () => {
      const created = repo.create({ name: 'Test' })
      const updated = repo.update(created.id, { engagementScore: 75 })

      expect(updated?.engagementScore).toBe(75)
    })

    it('should update fan power dynamic', () => {
      const created = repo.create({ name: 'Test' })
      const updated = repo.update(created.id, { powerDynamic: 'dominant' })

      expect(updated?.powerDynamic).toBe('dominant')
    })

    it('should return null for non-existent fan', () => {
      const updated = repo.update('non-existent', { name: 'Test' })
      expect(updated).toBeNull()
    })
  })

  describe('delete', () => {
    it('should delete a fan', () => {
      const created = repo.create({ name: 'ToDelete' })
      const result = repo.delete(created.id)

      expect(result).toBe(true)
      expect(repo.getById(created.id)).toBeNull()
    })

    it('should return false for non-existent fan', () => {
      const result = repo.delete('non-existent')
      expect(result).toBe(false)
    })
  })

  describe('updatePhase', () => {
    it('should update fan phase', () => {
      const created = repo.create({ name: 'Test' })
      const result = repo.updatePhase(created.id, 2)

      expect(result).toBe(true)
      expect(repo.getById(created.id)?.currentPhase).toBe(2)
    })
  })

  describe('updateEngagementScore', () => {
    it('should update engagement score', () => {
      const created = repo.create({ name: 'Test' })
      const result = repo.updateEngagementScore(created.id, 50)

      expect(result).toBe(true)
      expect(repo.getById(created.id)?.engagementScore).toBe(50)
    })

    it('should clamp score to 0-100 range', () => {
      const created = repo.create({ name: 'Test' })

      repo.updateEngagementScore(created.id, 150)
      expect(repo.getById(created.id)?.engagementScore).toBe(100)

      repo.updateEngagementScore(created.id, -50)
      expect(repo.getById(created.id)?.engagementScore).toBe(0)
    })
  })

  describe('updatePowerDynamic', () => {
    it('should update power dynamic', () => {
      const created = repo.create({ name: 'Test' })
      const result = repo.updatePowerDynamic(created.id, 'submissive')

      expect(result).toBe(true)
      expect(repo.getById(created.id)?.powerDynamic).toBe('submissive')
    })
  })

  describe('addDiscountOffered', () => {
    it('should add discount offered', () => {
      const created = repo.create({ name: 'Test' })
      const result = repo.addDiscountOffered(created.id, 'ppv-123')

      expect(result).toBe(true)
      expect(repo.getById(created.id)?.discountsOffered).toContain('ppv-123')
    })

    it('should not duplicate discounts', () => {
      const created = repo.create({ name: 'Test' })
      repo.addDiscountOffered(created.id, 'ppv-123')
      repo.addDiscountOffered(created.id, 'ppv-123')

      const fan = repo.getById(created.id)
      expect(fan?.discountsOffered).toEqual(['ppv-123'])
    })
  })

  describe('addPreference', () => {
    it('should add preference', () => {
      const created = repo.create({ name: 'Test' })
      const result = repo.addPreference(created.id, 'feet')

      expect(result).toBe(true)
      expect(repo.getById(created.id)?.preferences).toContain('feet')
    })

    it('should not duplicate preferences', () => {
      const created = repo.create({ name: 'Test' })
      repo.addPreference(created.id, 'feet')
      repo.addPreference(created.id, 'feet')

      const fan = repo.getById(created.id)
      expect(fan?.preferences).toEqual(['feet'])
    })
  })

  describe('search', () => {
    it('should search fans by name', () => {
      repo.create({ name: 'Alice' })
      repo.create({ name: 'Bob' })
      repo.create({ name: 'Charlie' })

      const results = repo.search('ali')
      expect(results).toHaveLength(1)
      expect(results[0]?.name).toBe('Alice')
    })

    it('should be case-insensitive', () => {
      repo.create({ name: 'Alice' })

      const results = repo.search('ALICE')
      expect(results).toHaveLength(1)
    })
  })

  describe('count', () => {
    it('should count fans', () => {
      repo.create({ name: 'Fan1' })
      repo.create({ name: 'Fan2' })

      expect(repo.count()).toBe(2)
    })
  })
})
