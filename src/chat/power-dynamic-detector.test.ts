import { describe, it, expect, beforeEach } from 'vitest'
import {
  PowerDynamicDetector,
  getPowerDynamicDetector,
  resetPowerDynamicDetector,
} from './power-dynamic-detector'

describe('PowerDynamicDetector', () => {
  let detector: PowerDynamicDetector

  beforeEach(() => {
    resetPowerDynamicDetector()
    detector = getPowerDynamicDetector()
  })

  describe('detect', () => {
    it('should return neutral for empty messages', () => {
      expect(detector.detect([])).toBe('neutral')
    })

    it('should detect submissive dynamic', () => {
      const messages = ['Was that good enough for you?', 'I hope you like it 🥺']
      expect(detector.detect(messages)).toBe('submissive')
    })

    it('should detect dominant dynamic', () => {
      const messages = ['Do it now.', 'You will obey me 😈']
      expect(detector.detect(messages)).toBe('dominant')
    })

    it('should return neutral for balanced messages', () => {
      const messages = ['Hey there!', 'How are you doing?']
      expect(detector.detect(messages)).toBe('neutral')
    })

    it('should return neutral when scores are close', () => {
      const messages = ['Was that good?', 'But also prove it to me']
      // One submissive + one dominant indicator = neutral
      expect(detector.detect(messages)).toBe('neutral')
    })

    it('should only consider last 5 messages', () => {
      const oldMessages = ['Do it now.', 'You will obey.', 'Prove yourself.', 'I command you.']
      const newMessages = [
        'Was that good? 🥺',
        'I hope I did it right for you',
        'Please tell me if I did well',
        'Am I doing this right? 🙈',
      ]
      const allMessages = [...oldMessages, ...newMessages]

      // New submissive messages (4) should override old dominant ones (not in last 5)
      expect(detector.detect(allMessages)).toBe('submissive')
    })
  })

  describe('getToneGuidance', () => {
    it('should return tone for submissive', () => {
      const tone = detector.getToneGuidance('submissive')
      expect(tone).toBeTruthy()
      expect(typeof tone).toBe('string')
    })

    it('should return tone for dominant', () => {
      const tone = detector.getToneGuidance('dominant')
      expect(tone).toBeTruthy()
      expect(typeof tone).toBe('string')
    })

    it('should return tone for neutral', () => {
      const tone = detector.getToneGuidance('neutral')
      expect(tone).toBeTruthy()
      expect(typeof tone).toBe('string')
    })
  })

  describe('getExamplePhrases', () => {
    it('should return example phrases for each dynamic', () => {
      expect(detector.getExamplePhrases('submissive').length).toBeGreaterThan(0)
      expect(detector.getExamplePhrases('dominant').length).toBeGreaterThan(0)
      expect(detector.getExamplePhrases('neutral').length).toBeGreaterThan(0)
    })
  })

  describe('getRecommendedEmojis', () => {
    it('should return emojis for each dynamic', () => {
      expect(detector.getRecommendedEmojis('submissive').length).toBeGreaterThan(0)
      expect(detector.getRecommendedEmojis('dominant').length).toBeGreaterThan(0)
      expect(detector.getRecommendedEmojis('neutral').length).toBeGreaterThan(0)
    })
  })

  describe('buildDynamicPrompt', () => {
    it('should build prompt for submissive', () => {
      const prompt = detector.buildDynamicPrompt('submissive')
      expect(prompt).toContain('submissive')
      expect(prompt).toContain('Tone:')
    })

    it('should build prompt for dominant', () => {
      const prompt = detector.buildDynamicPrompt('dominant')
      expect(prompt).toContain('dominant')
      expect(prompt).toContain('Tone:')
    })

    it('should build prompt for neutral', () => {
      const prompt = detector.buildDynamicPrompt('neutral')
      expect(prompt).toContain('neutral')
      expect(prompt).toContain('Tone:')
    })
  })
})
