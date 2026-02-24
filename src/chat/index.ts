export { ConversationEngine, createConversationEngine } from './conversation-engine'
export type { ConversationState, BotResponse } from './conversation-engine'

export { buildContextWindow, formatContextForLLM, needsSummarization } from './context-builder'
export type { ConversationMessage, ContextWindow } from './context-builder'

export {
  calculateScore,
  detectSexualKeywords,
  detectSentiment,
  detectPowerDynamic,
} from './scoring-system'
export type { ScoringFactors, ScoreBreakdown } from './scoring-system'

export { PhaseManager, getPhaseManager, resetPhaseManager } from './phase-manager'
export type { PhaseState, PhaseTransition, TransitionTrigger } from './phase-manager'

export {
  PowerDynamicDetector,
  getPowerDynamicDetector,
  resetPowerDynamicDetector,
} from './power-dynamic-detector'
