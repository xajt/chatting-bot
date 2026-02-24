import { z } from 'zod'

// Power dynamic types
export const PowerDynamicSchema = z.enum(['submissive', 'dominant', 'neutral'])
export type PowerDynamic = z.infer<typeof PowerDynamicSchema>

// Phase types
export const PhaseSchema = z.union([
  z.literal(1), // Introduction
  z.literal(2), // Flirting
  z.literal(3), // Heating up
  z.literal(4), // Close
])
export type Phase = z.infer<typeof PhaseSchema>

export const PHASE_NAMES: Record<Phase, string> = {
  1: 'Introduction',
  2: 'Flirting',
  3: 'Heating Up',
  4: 'Close',
} as const

// Phase thresholds
export const PHASE_THRESHOLDS: Record<Phase, number> = {
  1: 0,
  2: 30,
  3: 50,
  4: 70,
} as const

// CTA types
export const CTATypeSchema = z.enum([
  'video_question',
  'if_you_were_here',
  'follow_up',
  'gamification',
  'fomo',
  'dominant',
  'soft',
])
export type CTAType = z.infer<typeof CTATypeSchema>

// Example conversation
export const PersonaExampleSchema = z.object({
  fan: z.string(),
  response: z.union([z.string(), z.array(z.string())]),
})
export type PersonaExample = z.infer<typeof PersonaExampleSchema>

// Power dynamic config
export const PowerDynamicConfigSchema = z.object({
  tone: z.string(),
  example_phrases: z.array(z.string()),
  emojis: z.array(z.string()),
})
export type PowerDynamicConfig = z.infer<typeof PowerDynamicConfigSchema>

// CTA templates
export const CTATemplatesSchema = z.record(z.string(), z.array(z.string()))
export type CTATemplates = z.infer<typeof CTATemplatesSchema>

// Discount messaging
export const DiscountMessagingSchema = z.object({
  template: z.string(),
})
export type DiscountMessaging = z.infer<typeof DiscountMessagingSchema>

// Style config
export const StyleConfigSchema = z.object({
  emoji_usage: z.enum(['heavy', 'moderate', 'minimal']),
  capitalization: z.enum(['casual', 'proper', 'mixed']),
  punctuation: z.enum(['relaxed', 'proper', 'minimal']),
  abbreviations: z.boolean(),
  lowercase_start: z.boolean(),
  multiple_messages: z.boolean(),
})
export type StyleConfig = z.infer<typeof StyleConfigSchema>

// Guidelines
export const GuidelinesSchema = z.object({
  do: z.array(z.string()),
  dont: z.array(z.string()),
})
export type Guidelines = z.infer<typeof GuidelinesSchema>

// Full persona schema
export const PersonaSchema = z.object({
  name: z.string(),
  age: z.number(),
  location: z.string(),
  personality: z.array(z.string()),
  style: StyleConfigSchema,
  background: z.string(),
  guidelines: GuidelinesSchema,
  examples: z.array(PersonaExampleSchema),
  power_dynamics: z.object({
    submissive: PowerDynamicConfigSchema,
    dominant: PowerDynamicConfigSchema,
    neutral: PowerDynamicConfigSchema,
  }),
  cta_templates: CTATemplatesSchema,
  discount_messaging: DiscountMessagingSchema,
})
export type Persona = z.infer<typeof PersonaSchema>

// Phase transition thresholds
export const MIN_MESSAGES_PER_PHASE = 5
export const SEXUAL_KEYWORDS = [
  'naked',
  'nude',
  'nudes',
  'fuck',
  'fucking',
  'sex',
  'horny',
  'dick',
  'cock',
  'pussy',
  'boobs',
  'tits',
  'cum',
  'orgasm',
  'masturbate',
  'masturbating',
  'blowjob',
  'handjob',
  'anal',
  'undress',
  'take off',
  'touch myself',
  'wet',
  'hard',
  'inside me',
  'inside you',
] as const

export const SEXUAL_KEYWORD_SCORES: Record<string, number> = {
  naked: 8,
  nude: 8,
  nudes: 10,
  fuck: 10,
  fucking: 10,
  sex: 8,
  horny: 7,
  dick: 8,
  cock: 10,
  pussy: 10,
  ass: 5,
  boobs: 6,
  tits: 7,
  cum: 10,
  orgasm: 8,
  masturbate: 10,
  masturbating: 10,
  blowjob: 10,
  handjob: 8,
  anal: 10,
  undress: 7,
  'take off': 7,
  'touch myself': 9,
  wet: 6,
  hard: 5,
  'inside me': 10,
  'inside you': 10,
}
