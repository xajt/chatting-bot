import { z } from 'zod'
import { CTATypeSchema } from '../persona/persona-types'

export const PPVScriptSchema = z.object({
  id: z.string(),
  title: z.string(),
  contentText: z.string(),
  price: z.number().int().positive(), // in cents
  category: z.string(),
  tags: z.array(z.string()),
  previewText: z.string(),
  ctaType: CTATypeSchema,
  timesUsed: z.number().int().nonnegative(),
  createdAt: z.date(),
})

export type PPVScript = z.infer<typeof PPVScriptSchema>

export const PurchaseSchema = z.object({
  id: z.string(),
  fanId: z.string(),
  ppvId: z.string(),
  pricePaid: z.number().int().nonnegative(),
  discountApplied: z.number().int().nonnegative(),
  createdAt: z.date(),
})

export type Purchase = z.infer<typeof PurchaseSchema>
