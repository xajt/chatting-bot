import { type PowerDynamic } from '../persona/persona-types'
import { getPersona } from '../persona/persona-loader'

/**
 * Power Dynamic Detector analyzes messages to determine
 * whether the fan prefers a submissive, dominant, or neutral dynamic.
 */
export class PowerDynamicDetector {
  private readonly persona = getPersona()

  // Submissive fan indicators
  private readonly submissivePatterns = [
    /\b(was that good|did i do it right|am i doing.*right)\b/i,
    /\b(i hope you like|i hope that's okay)\b/i,
    /\b(please|beg|begging)\b/i,
    /\b(for you|just for you)\b/i,
    /\b(am i allowed|can i|may i)\b/i,
    /\b(sorry|apologize)\b/i,
    /🥺|😊|🙈|💕/,
  ]

  // Dominant fan indicators
  private readonly dominantPatterns = [
    /\b(do it now|you will|you must)\b/i,
    /\b(prove|show me)\b/i,
    /\b(i want you to|i command|i order)\b/i,
    /\b(better be|it better)\b/i,
    /\b(kneel|submit|obey)\b/i,
    /\b(good girl|bad girl)\b/i,
    /😈|💅|🔥/,
  ]

  /**
   * Detect power dynamic from recent messages
   */
  detect(messages: string[]): PowerDynamic {
    if (messages.length === 0) {
      return 'neutral'
    }

    const combinedText = messages.slice(-5).join(' ')

    let submissiveScore = 0
    let dominantScore = 0

    // Check submissive patterns
    for (const pattern of this.submissivePatterns) {
      if (pattern.test(combinedText)) {
        submissiveScore++
      }
    }

    // Check dominant patterns
    for (const pattern of this.dominantPatterns) {
      if (pattern.test(combinedText)) {
        dominantScore++
      }
    }

    // Determine dynamic based on scores
    if (dominantScore > submissiveScore + 1) {
      return 'dominant'
    }

    if (submissiveScore > dominantScore + 1) {
      return 'submissive'
    }

    return 'neutral'
  }

  /**
   * Get tone guidance for a power dynamic
   */
  getToneGuidance(dynamic: PowerDynamic): string {
    const config = this.persona.power_dynamics[dynamic]
    return config?.tone ?? 'Playful and balanced'
  }

  /**
   * Get example phrases for a power dynamic
   */
  getExamplePhrases(dynamic: PowerDynamic): string[] {
    const config = this.persona.power_dynamics[dynamic]
    return config?.example_phrases ?? []
  }

  /**
   * Get recommended emojis for a power dynamic
   */
  getRecommendedEmojis(dynamic: PowerDynamic): string[] {
    const config = this.persona.power_dynamics[dynamic]
    return config?.emojis ?? ['😏', '🥰']
  }

  /**
   * Build dynamic-specific prompt guidance
   */
  buildDynamicPrompt(dynamic: PowerDynamic): string {
    const config = this.persona.power_dynamics[dynamic]
    if (!config) {
      return ''
    }

    return `## Power Dynamic: ${dynamic}
Tone: ${config.tone}
Example phrases to use: ${config.example_phrases.slice(0, 3).join(' / ')}
Use these emojis: ${config.emojis.slice(0, 4).join(' ')}`
  }
}

// Singleton instance
let detector: PowerDynamicDetector | null = null

export function getPowerDynamicDetector(): PowerDynamicDetector {
  if (!detector) {
    detector = new PowerDynamicDetector()
  }
  return detector
}

export function resetPowerDynamicDetector(): void {
  detector = null
}
