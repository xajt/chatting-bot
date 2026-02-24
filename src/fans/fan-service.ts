import { getFanRepository } from './fan-repository'
import type { FanProfile, FanSummary, CreateFanInput, UpdateFanInput } from './fan-types'
import type { Phase, PowerDynamic } from '../persona/persona-types'

export interface FanStats {
  totalFans: number
  averageEngagement: number
  fansByPhase: Record<string, number>
  fansByDynamic: Record<string, number>
}

/**
 * Fan Service provides business logic for fan management.
 */
export class FanService {
  private readonly repo = getFanRepository()

  /**
   * Create a new fan
   */
  createFan(input: CreateFanInput): FanProfile {
    // Check if fan with this name already exists
    const existing = this.repo.getByName(input.name)
    if (existing) {
      return existing
    }

    return this.repo.create(input)
  }

  /**
   * Get fan by ID
   */
  getFanById(id: string): FanProfile | null {
    return this.repo.getById(id)
  }

  /**
   * Get fan by name
   */
  getFanByName(name: string): FanProfile | null {
    return this.repo.getByName(name)
  }

  /**
   * Get all fans
   */
  getAllFans(): FanProfile[] {
    return this.repo.getAll()
  }

  /**
   * Get fan summaries (lighter weight)
   */
  getFanSummaries(): FanSummary[] {
    return this.repo.getSummaries()
  }

  /**
   * Update fan profile
   */
  updateFan(id: string, input: UpdateFanInput): FanProfile | null {
    return this.repo.update(id, input)
  }

  /**
   * Delete a fan
   */
  deleteFan(id: string): boolean {
    return this.repo.delete(id)
  }

  /**
   * Update fan's phase after conversation
   */
  updateFanPhase(fanId: string, newPhase: Phase): boolean {
    return this.repo.updatePhase(fanId, newPhase)
  }

  /**
   * Update fan's engagement score
   */
  updateFanScore(fanId: string, newScore: number): boolean {
    return this.repo.updateEngagementScore(fanId, newScore)
  }

  /**
   * Update fan's power dynamic
   */
  updateFanPowerDynamic(fanId: string, dynamic: PowerDynamic): boolean {
    return this.repo.updatePowerDynamic(fanId, dynamic)
  }

  /**
   * Record that a discount was offered to a fan
   */
  recordDiscountOffered(fanId: string, ppvId: string): boolean {
    return this.repo.addDiscountOffered(fanId, ppvId)
  }

  /**
   * Add a preference to fan's profile
   */
  addFanPreference(fanId: string, preference: string): boolean {
    return this.repo.addPreference(fanId, preference)
  }

  /**
   * Check if fan has received a discount for a specific PPV
   */
  hasDiscountBeenOffered(fanId: string, ppvId: string): boolean {
    const fan = this.repo.getById(fanId)
    if (!fan) {
      return false
    }
    return fan.discountsOffered.includes(ppvId)
  }

  /**
   * Get fan statistics
   */
  getStats(): FanStats {
    const fans = this.repo.getAll()

    const fansByPhase: Record<string, number> = {
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
    }

    const fansByDynamic: Record<string, number> = {
      submissive: 0,
      dominant: 0,
      neutral: 0,
    }

    let totalEngagement = 0

    for (const fan of fans) {
      fansByPhase[fan.currentPhase.toString()] = (fansByPhase[fan.currentPhase.toString()] ?? 0) + 1
      fansByDynamic[fan.powerDynamic] = (fansByDynamic[fan.powerDynamic] ?? 0) + 1
      totalEngagement += fan.engagementScore
    }

    return {
      totalFans: fans.length,
      averageEngagement: fans.length > 0 ? Math.round(totalEngagement / fans.length) : 0,
      fansByPhase,
      fansByDynamic,
    }
  }

  /**
   * Search fans by name
   */
  searchFans(query: string): FanProfile[] {
    if (!query.trim()) {
      return []
    }
    return this.repo.search(query)
  }

  /**
   * Get fans by phase
   */
  getFansByPhase(phase: Phase): FanProfile[] {
    const allFans = this.repo.getAll()
    return allFans.filter((fan) => fan.currentPhase === phase)
  }

  /**
   * Get fans by power dynamic
   */
  getFansByDynamic(dynamic: PowerDynamic): FanProfile[] {
    const allFans = this.repo.getAll()
    return allFans.filter((fan) => fan.powerDynamic === dynamic)
  }

  /**
   * Get fans with high engagement (score >= 70)
   */
  getHighEngagementFans(): FanProfile[] {
    const allFans = this.repo.getAll()
    return allFans.filter((fan) => fan.engagementScore >= 70)
  }

  /**
   * Get or create fan by name
   */
  getOrCreateFan(name: string, nickname?: string): FanProfile {
    const existing = this.repo.getByName(name)
    if (existing) {
      return existing
    }
    return this.repo.create({ name, nickname })
  }

  /**
   * Format fan profile for display
   */
  formatFanProfile(fan: FanProfile): string {
    const lines = [
      `📋 Fan Profile: ${fan.name}`,
      `   ID: ${fan.id}`,
      `   Phase: ${fan.currentPhase}`,
      `   Engagement: ${fan.engagementScore}/100`,
      `   Dynamic: ${fan.powerDynamic}`,
    ]

    if (fan.nickname) {
      lines.push(`   Nickname: ${fan.nickname}`)
    }

    if (fan.preferences.length > 0) {
      lines.push(`   Preferences: ${fan.preferences.join(', ')}`)
    }

    if (fan.discountsOffered.length > 0) {
      lines.push(`   Discounts Offered: ${fan.discountsOffered.length}`)
    }

    if (fan.notes) {
      lines.push(`   Notes: ${fan.notes}`)
    }

    return lines.join('\n')
  }

  /**
   * Format fan summary for list display
   */
  formatFanSummary(summary: FanSummary): string {
    const phaseEmoji = {
      1: '👋',
      2: '😏',
      3: '🔥',
      4: '💰',
    }

    const lastMessage = summary.lastMessageAt
      ? formatTimeAgo(summary.lastMessageAt)
      : 'Never'

    return `${phaseEmoji[summary.currentPhase as keyof typeof phaseEmoji] ?? '❓'} ${summary.name.padEnd(15)} Phase ${summary.currentPhase}  Score: ${summary.engagementScore.toString().padStart(3)}  Purchases: ${summary.totalPurchases}  Last: ${lastMessage}`
  }
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

// Singleton instance
let fanService: FanService | null = null

export function getFanService(): FanService {
  if (!fanService) {
    fanService = new FanService()
  }
  return fanService
}

export function resetFanService(): void {
  fanService = null
}
