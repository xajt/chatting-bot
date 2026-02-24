import { z } from 'zod'
import type { Phase, PowerDynamic } from '../persona/persona-types'

export const FanProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  nickname: z.string().optional(),
  currentPhase: z.number().min(1).max(4),
  engagementScore: z.number().min(0).max(100),
  powerDynamic: z.enum(['submissive', 'dominant', 'neutral']),
  preferences: z.array(z.string()),
  discountsOffered: z.array(z.string()), // PPV IDs
  notes: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type FanProfile = z.infer<typeof FanProfileSchema>

export const FanSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  currentPhase: z.number(),
  engagementScore: z.number(),
  lastMessageAt: z.date().nullable(),
  totalPurchases: z.number(),
})

export type FanSummary = z.infer<typeof FanSummarySchema>

export interface CreateFanInput {
  name: string
  nickname?: string
}

export interface UpdateFanInput {
  name?: string
  nickname?: string
  currentPhase?: Phase
  engagementScore?: number
  powerDynamic?: PowerDynamic
  preferences?: string[]
  discountsOffered?: string[]
  notes?: string
}
