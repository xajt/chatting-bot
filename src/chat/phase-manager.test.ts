import { describe, it, expect, beforeEach } from 'vitest'
import { PhaseManager, getPhaseManager, resetPhaseManager } from './phase-manager'
import type { PhaseState } from './phase-manager'

describe('PhaseManager', () => {
  let manager: PhaseManager

  beforeEach(() => {
    resetPhaseManager()
    manager = getPhaseManager()
  })

  describe('calculateNextPhase', () => {
    it('should return null when not enough messages in phase', () => {
      const state: PhaseState = {
        currentPhase: 1,
        messagesInPhase: 3,
        score: 35,
        explicitContentDetected: false,
      }

      const transition = manager.calculateNextPhase(state)
      expect(transition).toBeNull()
    })

    it('should transition Phase 1→2 when score >= 30 and messages >= 5', () => {
      const state: PhaseState = {
        currentPhase: 1,
        messagesInPhase: 5,
        score: 35,
        explicitContentDetected: false,
      }

      const transition = manager.calculateNextPhase(state)
      expect(transition).toEqual({
        from: 1,
        to: 2,
        trigger: 'score',
        threshold: 30,
      })
    })

    it('should transition Phase 2→3 when score >= 50 and messages >= 5', () => {
      const state: PhaseState = {
        currentPhase: 2,
        messagesInPhase: 5,
        score: 55,
        explicitContentDetected: false,
      }

      const transition = manager.calculateNextPhase(state)
      expect(transition).toEqual({
        from: 2,
        to: 3,
        trigger: 'score',
        threshold: 50,
      })
    })

    it('should transition Phase 3→4 when score >= 70 and messages >= 5', () => {
      const state: PhaseState = {
        currentPhase: 3,
        messagesInPhase: 5,
        score: 75,
        explicitContentDetected: false,
      }

      const transition = manager.calculateNextPhase(state)
      expect(transition).toEqual({
        from: 3,
        to: 4,
        trigger: 'score',
        threshold: 70,
      })
    })

    it('should jump to Phase 3 on explicit content (low score)', () => {
      const state: PhaseState = {
        currentPhase: 1,
        messagesInPhase: 2,
        score: 15,
        explicitContentDetected: true,
      }

      const transition = manager.calculateNextPhase(state)
      expect(transition).toEqual({
        from: 1,
        to: 3,
        trigger: 'explicit_content',
      })
    })

    it('should jump to Phase 4 on explicit content (high score)', () => {
      const state: PhaseState = {
        currentPhase: 1,
        messagesInPhase: 2,
        score: 55,
        explicitContentDetected: true,
      }

      const transition = manager.calculateNextPhase(state)
      expect(transition).toEqual({
        from: 1,
        to: 4,
        trigger: 'explicit_content',
      })
    })

    it('should not allow phase to go backwards', () => {
      const state: PhaseState = {
        currentPhase: 3,
        messagesInPhase: 5,
        score: 10, // Low score but already in phase 3
        explicitContentDetected: false,
      }

      const transition = manager.calculateNextPhase(state)
      expect(transition).toBeNull() // Should stay in phase 3
    })
  })

  describe('getPhaseForScore', () => {
    it('should return Phase 1 for score < 30', () => {
      expect(manager.getPhaseForScore(0)).toBe(1)
      expect(manager.getPhaseForScore(15)).toBe(1)
      expect(manager.getPhaseForScore(29)).toBe(1)
    })

    it('should return Phase 2 for score 30-49', () => {
      expect(manager.getPhaseForScore(30)).toBe(2)
      expect(manager.getPhaseForScore(40)).toBe(2)
      expect(manager.getPhaseForScore(49)).toBe(2)
    })

    it('should return Phase 3 for score 50-69', () => {
      expect(manager.getPhaseForScore(50)).toBe(3)
      expect(manager.getPhaseForScore(60)).toBe(3)
      expect(manager.getPhaseForScore(69)).toBe(3)
    })

    it('should return Phase 4 for score >= 70', () => {
      expect(manager.getPhaseForScore(70)).toBe(4)
      expect(manager.getPhaseForScore(85)).toBe(4)
      expect(manager.getPhaseForScore(100)).toBe(4)
    })
  })

  describe('isValidTransition', () => {
    it('should allow forward transitions', () => {
      expect(manager.isValidTransition(1, 2)).toBe(true)
      expect(manager.isValidTransition(2, 3)).toBe(true)
      expect(manager.isValidTransition(3, 4)).toBe(true)
      expect(manager.isValidTransition(1, 4)).toBe(true)
    })

    it('should not allow backward transitions', () => {
      expect(manager.isValidTransition(2, 1)).toBe(false)
      expect(manager.isValidTransition(3, 2)).toBe(false)
      expect(manager.isValidTransition(4, 1)).toBe(false)
    })

    it('should not allow same phase transition', () => {
      expect(manager.isValidTransition(1, 1)).toBe(false)
      expect(manager.isValidTransition(2, 2)).toBe(false)
    })
  })

  describe('getPhaseName', () => {
    it('should return correct phase names', () => {
      expect(manager.getPhaseName(1)).toBe('Introduction')
      expect(manager.getPhaseName(2)).toBe('Flirting')
      expect(manager.getPhaseName(3)).toBe('Heating Up')
      expect(manager.getPhaseName(4)).toBe('Close')
    })
  })

  describe('shouldOfferPPV', () => {
    it('should not offer PPV in Phase 1', () => {
      expect(manager.shouldOfferPPV(1, 80)).toBe(false)
    })

    it('should not offer PPV in Phase 2', () => {
      expect(manager.shouldOfferPPV(2, 80)).toBe(false)
    })

    it('should offer PPV in Phase 3 with score >= 60', () => {
      expect(manager.shouldOfferPPV(3, 60)).toBe(true)
      expect(manager.shouldOfferPPV(3, 59)).toBe(false)
    })

    it('should offer PPV in Phase 4 with score >= 60', () => {
      expect(manager.shouldOfferPPV(4, 60)).toBe(true)
      expect(manager.shouldOfferPPV(4, 70)).toBe(true)
    })
  })
})
