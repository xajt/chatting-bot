import { getPPVRepository } from './ppv-repository'
import { getCTALibrary } from './cta-library'
import { getObjectionHandler } from './objection-handler'
import { getDiscountManager } from './discount-manager'
import type { PPVScript, Purchase } from './ppv-types'
import type { PowerDynamic } from '../persona/persona-types'

export interface PPVOfferContext {
  fanId: string
  fanName: string
  powerDynamic: PowerDynamic
  discountsOffered: string[]
}

export interface PPVOffer {
  ppv: PPVScript
  ctaMessage: string
  originalPrice: number
}

export interface HandleObjectionResult {
  type: string
  response: string
  discountedPrice?: number
  discountOffered: boolean
}

/**
 * Get a random PPV offer
 */
export function getRandomPPVOffer(fanName: string, powerDynamic: PowerDynamic): PPVOffer | null {
  const repo = getPPVRepository()
  const cta = getCTALibrary()

  const ppv = repo.getRandom()
  if (!ppv) {
    return null
  }

  const ctaMessage = cta.getAppropriateCTA({
    fanName,
    ppvTitle: ppv.title,
    ppvPrice: ppv.price,
    powerDynamic,
  })

  return {
    ppv,
    ctaMessage,
    originalPrice: ppv.price,
  }
}

/**
 * Handle fan's objection to PPV
 */
export async function handleObjection(
  fanMessage: string,
  ppvId: string,
  originalPrice: number,
  discountAvailable: boolean
) {
  const handler = getObjectionHandler()
  const discount = getDiscountManager()

  const result = await handler.handleObjectionInternal(fanMessage, originalPrice, discountAvailable)

  let discountedPrice: number | undefined
  if (result.shouldOfferDiscount) {
    discountedPrice = discount.calculateDiscountedPrice(originalPrice)
  }

  return {
    type: result.type,
    response: result.response,
    discountedPrice,
    discountOffered: result.shouldOfferDiscount,
  }
}

/**
 * Record a purchase
 */
export function recordPurchase(
  fanId: string,
  ppvId: string,
  pricePaid: number,
  originalPrice: number
): Purchase {
  const repo = getPPVRepository()
  const discount = getDiscountManager()

  const discountApplied = discount.calculateSavings(originalPrice, pricePaid)

  return repo.recordPurchase({
    fanId,
    ppvId,
    pricePaid,
    discountApplied,
  })
}

/**
 * Get all PPV scripts
 */
export function getAllPPVs(): PPVScript[] {
  return getPPVRepository().getAll()
}

/**
 * Get PPV by ID
 */
export function getPPVById(id: string): PPVScript | null {
  return getPPVRepository().getById(id)
}

/**
 * Get fan purchases
 */
export function getFanPurchases(fanId: string): Purchase[] {
  return getPPVRepository().getPurchasesByFan(fanId)
}

/**
 * Check if fan purchased PPV
 */
export function hasFanPurchased(fanId: string, ppvId: string): boolean {
  return getPPVRepository().hasFanPurchased(fanId, ppvId)
}

/**
 * Get follow-up CTA
 */
export function getFollowUpCTA(fanName: string, ppvTitle: string, powerDynamic: PowerDynamic): string {
  return getCTALibrary().getFollowUpCTA({
    fanName,
    ppvTitle,
    ppvPrice: 0,
    powerDynamic,
  })
}
