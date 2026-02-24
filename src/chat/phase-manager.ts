import { type Phase, PHASE_THRESHOLDS, PHASE_NAMES, MIN_MESSAGES_PER_PHASE } from '../persona/persona-types'

export type TransitionTrigger = 'score' | 'explicit_content' | 'manual'

export interface PhaseTransition {
  from: Phase
  to: Phase
  trigger: TransitionTrigger
  threshold?: number
}

export interface PhaseState {
  currentPhase: Phase
  messagesInPhase: number
  score: number
  explicitContentDetected: boolean
}

/**
 * Phase Manager handles all phase transitions according to business rules:
 * - Phase 1→2: score >= 30 + min 5 messages in phase 1
 * - Phase 2→3: score >= 50 + min 5 messages in phase 2
 * - Phase 3→4: score >= 70 + min 5 messages in phase 3
 * - Explicit content: immediate jump to phase 3 or 4
 * - Phase NEVER goes backwards
 */
export class PhaseManager {
  /**
   * Calculate the next phase based on current state
   */
  calculateNextPhase(state: PhaseState): PhaseTransition | null {
    const { currentPhase, messagesInPhase, score, explicitContentDetected } = state

    // Phase never goes backwards
    if (explicitContentDetected && currentPhase < 3) {
      // Explicit content triggers immediate jump
      const targetPhase = score >= 50 ? 4 : 3
      return {
        from: currentPhase,
        to: targetPhase,
        trigger: 'explicit_content',
      }
    }

    // Check minimum messages requirement
    if (messagesInPhase < MIN_MESSAGES_PER_PHASE) {
      return null // Stay in current phase
    }

    // Check score-based transitions
    for (const [phaseStr, threshold] of Object.entries(PHASE_THRESHOLDS)) {
      const phase = parseInt(phaseStr) as Phase
      if (score >= threshold && phase > currentPhase) {
        return {
          from: currentPhase,
          to: phase,
          trigger: 'score',
          threshold,
        }
      }
    }

    return null // No transition needed
  }

  /**
   * Get the phase that should be active based on score only
   */
  getPhaseForScore(score: number): Phase {
    if (score >= PHASE_THRESHOLDS[4]) return 4
    if (score >= PHASE_THRESHOLDS[3]) return 3
    if (score >= PHASE_THRESHOLDS[2]) return 2
    return 1
  }

  /**
   * Check if a transition is valid
   */
  isValidTransition(from: Phase, to: Phase): boolean {
    // Phase can only go forward
    return to > from
  }

  /**
   * Get human-readable phase name
   */
  getPhaseName(phase: Phase): string {
    return PHASE_NAMES[phase] ?? 'Unknown'
  }

  /**
   * Get phase guidance prompt for LLM
   */
  getPhaseGuidance(phase: Phase): string {
    const guidance: Record<Phase, string> = {
      1: `Focus on small talk and getting to know each other.
- Ask engaging questions about their life
- Share stories about your day
- Build rapport naturally
- NO sexual content yet`,
      2: `Light flirting and building connection.
- Add playful teasing
- Show interest in them
- Drop hints about exclusive content
- Keep it fun and flirty`,
      3: `More intimate, suggesting exclusive content.
- Be more suggestive
- Talk about what you'd do together
- Build anticipation
- Can mention having "something special" for them`,
      4: `Ready to offer PPV content naturally.
- Offer content without asking permission
- Embed PPV naturally in conversation
- Use CTA techniques
- Don't be pushy - make it feel exclusive`,
    }
    return guidance[phase] ?? ''
  }

  /**
   * Check if PPV should be offered at current phase
   */
  shouldOfferPPV(phase: Phase, score: number): boolean {
    return phase >= 3 && score >= 60
  }
}

// Singleton instance
let phaseManager: PhaseManager | null = null

export function getPhaseManager(): PhaseManager {
  if (!phaseManager) {
    phaseManager = new PhaseManager()
  }
  return phaseManager
}

export function resetPhaseManager(): void {
  phaseManager = null
}
