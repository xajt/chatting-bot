/**
 * Discount Manager handles the 15% discount logic.
 * Key rules:
 * - 15% discount can only be offered ONCE per fan per PPV
 * - Track which PPVs have had discounts offered
 * - Never offer discount twice for same PPV to same fan
 */
export class DiscountManager {
  private readonly DISCOUNT_PERCENTAGE = 0.15 // 15%

  /**
   * Check if a discount can be offered for a specific PPV to a fan
   */
  canOfferDiscount(fanId: string, ppvId: string, discountsOffered: string[]): boolean {
    // Check if discount has already been offered for this PPV
    return !discountsOffered.includes(ppvId)
  }

  /**
   * Calculate discounted price (15% off)
   */
  calculateDiscountedPrice(originalPrice: number): number {
    return Math.round(originalPrice * (1 - this.DISCOUNT_PERCENTAGE))
  }

  /**
   * Get the discount percentage for display
   */
  getDiscountPercentage(): number {
    return this.DISCOUNT_PERCENTAGE * 100
  }

  /**
   * Record that a discount has been offered
   * Returns new array of discounts offered
   */
  recordDiscountOffered(fanId: string, ppvId: string, currentDiscounts: string[]): string[] {
    if (currentDiscounts.includes(ppvId)) {
      return currentDiscounts // Already recorded
    }
    return [...currentDiscounts, ppvId]
  }

  /**
   * Format discount message
   */
  formatDiscountMessage(originalPrice: number, fanName: string): string {
    const discountedPrice = this.calculateDiscountedPrice(originalPrice)
    const originalDollars = (originalPrice / 100).toFixed(0)
    const discountedDollars = (discountedPrice / 100).toFixed(0)

    return `honestly... you've been so fun to talk to
let me do $${discountedDollars} instead 🥺
just between us, okay?`
  }

  /**
   * Check if price represents a discount
   */
  isDiscountedPrice(originalPrice: number, paidPrice: number): boolean {
    return paidPrice < originalPrice
  }

  /**
   * Calculate how much was saved
   */
  calculateSavings(originalPrice: number, paidPrice: number): number {
    return originalPrice - paidPrice
  }
}

// Singleton instance
let discountManager: DiscountManager | null = null

export function getDiscountManager(): DiscountManager {
  if (!discountManager) {
    discountManager = new DiscountManager()
  }
  return discountManager
}

export function resetDiscountManager(): void {
  discountManager = null
}
