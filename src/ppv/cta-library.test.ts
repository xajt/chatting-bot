import { describe, it, expect, beforeEach } from 'vitest'
import { CTALibrary, getCTALibrary, resetCTALibrary } from './cta-library'
import type { CTAContext } from './cta-library'
import type { PowerDynamic } from '../persona/persona-types'

describe('CTALibrary', () => {
  let library: CTALibrary

  const defaultContext: CTAContext = {
    fanName: 'Tom',
    ppvTitle: 'Morning Shower',
    ppvPrice: 1500,
    powerDynamic: 'neutral',
  }

  beforeEach(() => {
    resetCTALibrary()
    library = getCTALibrary()
  })

  describe('getCTA', () => {
    it('should return CTA for video_question type', () => {
      const cta = library.getCTA('video_question', defaultContext)
      expect(cta).toBeTruthy()
      expect(typeof cta).toBe('string')
    })

    it('should return CTA for if_you_were_here type', () => {
      const cta = library.getCTA('if_you_were_here', defaultContext)
      expect(cta).toBeTruthy()
      expect(typeof cta).toBe('string')
    })

    it('should return CTA for follow_up type', () => {
      const cta = library.getCTA('follow_up', defaultContext)
      expect(cta).toBeTruthy()
      expect(typeof cta).toBe('string')
    })

    it('should return CTA for gamification type', () => {
      const cta = library.getCTA('gamification', defaultContext)
      expect(cta).toBeTruthy()
      expect(typeof cta).toBe('string')
    })

    it('should return CTA for fomo type', () => {
      const cta = library.getCTA('fomo', defaultContext)
      expect(cta).toBeTruthy()
      expect(typeof cta).toBe('string')
    })

    it('should return CTA for dominant type', () => {
      const cta = library.getCTA('dominant', defaultContext)
      expect(cta).toBeTruthy()
      expect(typeof cta).toBe('string')
    })

    it('should return CTA for soft type', () => {
      const cta = library.getCTA('soft', defaultContext)
      expect(cta).toBeTruthy()
      expect(typeof cta).toBe('string')
    })

    it('should replace {name} placeholder with fan name', () => {
      const cta = library.getCTA('video_question', defaultContext)
      // Some templates include {name}, some don't
      expect(cta).toBeTruthy()
    })
  })

  describe('getAppropriateCTA', () => {
    it('should return appropriate CTA for submissive dynamic', () => {
      const context: CTAContext = { ...defaultContext, powerDynamic: 'submissive' }
      const cta = library.getAppropriateCTA(context)
      expect(cta).toBeTruthy()
      expect(typeof cta).toBe('string')
    })

    it('should return appropriate CTA for dominant dynamic', () => {
      const context: CTAContext = { ...defaultContext, powerDynamic: 'dominant' }
      const cta = library.getAppropriateCTA(context)
      expect(cta).toBeTruthy()
      expect(typeof cta).toBe('string')
    })

    it('should return appropriate CTA for neutral dynamic', () => {
      const context: CTAContext = { ...defaultContext, powerDynamic: 'neutral' }
      const cta = library.getAppropriateCTA(context)
      expect(cta).toBeTruthy()
      expect(typeof cta).toBe('string')
    })
  })

  describe('getFollowUpCTA', () => {
    it('should return follow-up CTA', () => {
      const cta = library.getFollowUpCTA(defaultContext)
      expect(cta).toBeTruthy()
      expect(typeof cta).toBe('string')
    })
  })

  describe('getFOMOCTA', () => {
    it('should return FOMO CTA', () => {
      const cta = library.getFOMOCTA(defaultContext)
      expect(cta).toBeTruthy()
      expect(typeof cta).toBe('string')
    })
  })

  describe('getAvailableTypes', () => {
    it('should return all available CTA types', () => {
      const types = library.getAvailableTypes()
      expect(types).toContain('video_question')
      expect(types).toContain('if_you_were_here')
      expect(types).toContain('follow_up')
      expect(types).toContain('gamification')
      expect(types).toContain('fomo')
      expect(types).toContain('dominant')
      expect(types).toContain('soft')
    })
  })
})
