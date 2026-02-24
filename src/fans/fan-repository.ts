import { randomUUID } from 'node:crypto'
import { getDatabase } from '../db/database'
import type { FanProfile, FanSummary, CreateFanInput, UpdateFanInput } from './fan-types'

interface FanRow {
  id: string
  name: string
  nickname: string | null
  current_phase: number
  engagement_score: number
  power_dynamic: string
  preferences: string
  discounts_offered: string
  notes: string
  created_at: string
  updated_at: string
}

function rowToFan(row: FanRow): FanProfile {
  return {
    id: row.id,
    name: row.name,
    nickname: row.nickname ?? undefined,
    currentPhase: row.current_phase,
    engagementScore: row.engagement_score,
    powerDynamic: row.power_dynamic as FanProfile['powerDynamic'],
    preferences: JSON.parse(row.preferences) as string[],
    discountsOffered: JSON.parse(row.discounts_offered) as string[],
    notes: row.notes,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

/**
 * Fan Repository handles all database operations for fan profiles.
 */
export class FanRepository {
  /**
   * Get all fans
   */
  getAll(): FanProfile[] {
    const db = getDatabase()
    const rows = db.prepare('SELECT * FROM fans ORDER BY updated_at DESC').all() as FanRow[]
    return rows.map(rowToFan)
  }

  /**
   * Get fan by ID
   */
  getById(id: string): FanProfile | null {
    const db = getDatabase()
    const row = db.prepare('SELECT * FROM fans WHERE id = ?').get(id) as FanRow | undefined
    return row ? rowToFan(row) : null
  }

  /**
   * Get fan by name (case-insensitive)
   */
  getByName(name: string): FanProfile | null {
    const db = getDatabase()
    const row = db
      .prepare('SELECT * FROM fans WHERE LOWER(name) = LOWER(?)')
      .get(name) as FanRow | undefined
    return row ? rowToFan(row) : null
  }

  /**
   * Create a new fan
   */
  create(input: CreateFanInput): FanProfile {
    const db = getDatabase()
    const id = randomUUID()
    const now = new Date().toISOString()

    db.prepare(
      `INSERT INTO fans (id, name, nickname, current_phase, engagement_score, power_dynamic, preferences, discounts_offered, notes, created_at, updated_at)
       VALUES (?, ?, ?, 1, 0, 'neutral', '[]', '[]', '', ?, ?)`
    ).run(id, input.name, input.nickname ?? null, now, now)

    return {
      id,
      name: input.name,
      nickname: input.nickname,
      currentPhase: 1,
      engagementScore: 0,
      powerDynamic: 'neutral',
      preferences: [],
      discountsOffered: [],
      notes: '',
      createdAt: new Date(now),
      updatedAt: new Date(now),
    }
  }

  /**
   * Update a fan profile
   */
  update(id: string, input: UpdateFanInput): FanProfile | null {
    const existing = this.getById(id)
    if (!existing) {
      return null
    }

    const updates: string[] = []
    const values: (string | number)[] = []

    if (input.name !== undefined) {
      updates.push('name = ?')
      values.push(input.name)
    }
    if (input.nickname !== undefined) {
      updates.push('nickname = ?')
      values.push(input.nickname)
    }
    if (input.currentPhase !== undefined) {
      updates.push('current_phase = ?')
      values.push(input.currentPhase)
    }
    if (input.engagementScore !== undefined) {
      updates.push('engagement_score = ?')
      values.push(input.engagementScore)
    }
    if (input.powerDynamic !== undefined) {
      updates.push('power_dynamic = ?')
      values.push(input.powerDynamic)
    }
    if (input.preferences !== undefined) {
      updates.push('preferences = ?')
      values.push(JSON.stringify(input.preferences))
    }
    if (input.discountsOffered !== undefined) {
      updates.push('discounts_offered = ?')
      values.push(JSON.stringify(input.discountsOffered))
    }
    if (input.notes !== undefined) {
      updates.push('notes = ?')
      values.push(input.notes)
    }

    if (updates.length === 0) {
      return existing
    }

    updates.push('updated_at = ?')
    values.push(new Date().toISOString())

    const db = getDatabase()
    db.prepare(`UPDATE fans SET ${updates.join(', ')} WHERE id = ?`).run(...values, id)

    return this.getById(id)
  }

  /**
   * Delete a fan
   */
  delete(id: string): boolean {
    const db = getDatabase()
    const result = db.prepare('DELETE FROM fans WHERE id = ?').run(id)
    return result.changes > 0
  }

  /**
   * Get fan summaries (lighter weight for listing)
   */
  getSummaries(): FanSummary[] {
    const db = getDatabase()

    const rows = db
      .prepare(
        `SELECT
          f.id,
          f.name,
          f.current_phase,
          f.engagement_score,
          (SELECT MAX(created_at) FROM conversations WHERE fan_id = f.id) as last_message_at,
          (SELECT COUNT(*) FROM purchases WHERE fan_id = f.id) as total_purchases
        FROM fans f
        ORDER BY f.updated_at DESC`
      )
      .all() as Array<{
      id: string
      name: string
      current_phase: number
      engagement_score: number
      last_message_at: string | null
      total_purchases: number
    }>

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      currentPhase: row.current_phase,
      engagementScore: row.engagement_score,
      lastMessageAt: row.last_message_at ? new Date(row.last_message_at) : null,
      totalPurchases: row.total_purchases,
    }))
  }

  /**
   * Add a discount offered to fan
   */
  addDiscountOffered(fanId: string, ppvId: string): boolean {
    const fan = this.getById(fanId)
    if (!fan) {
      return false
    }

    if (fan.discountsOffered.includes(ppvId)) {
      return true // Already recorded
    }

    const updatedDiscounts = [...fan.discountsOffered, ppvId]
    this.update(fanId, { discountsOffered: updatedDiscounts })
    return true
  }

  /**
   * Add a preference to fan
   */
  addPreference(fanId: string, preference: string): boolean {
    const fan = this.getById(fanId)
    if (!fan) {
      return false
    }

    if (fan.preferences.includes(preference)) {
      return true // Already recorded
    }

    const updatedPreferences = [...fan.preferences, preference]
    this.update(fanId, { preferences: updatedPreferences })
    return true
  }

  /**
   * Update fan phase
   */
  updatePhase(fanId: string, phase: number): boolean {
    const result = this.update(fanId, { currentPhase: phase as 1 | 2 | 3 | 4 })
    return result !== null
  }

  /**
   * Update fan engagement score
   */
  updateEngagementScore(fanId: string, score: number): boolean {
    const result = this.update(fanId, { engagementScore: Math.max(0, Math.min(100, score)) })
    return result !== null
  }

  /**
   * Update fan power dynamic
   */
  updatePowerDynamic(
    fanId: string,
    dynamic: 'submissive' | 'dominant' | 'neutral'
  ): boolean {
    const result = this.update(fanId, { powerDynamic: dynamic })
    return result !== null
  }

  /**
   * Count total fans
   */
  count(): number {
    const db = getDatabase()
    const row = db.prepare('SELECT COUNT(*) as count FROM fans').get() as { count: number }
    return row.count
  }

  /**
   * Search fans by name
   */
  search(query: string): FanProfile[] {
    const db = getDatabase()
    const rows = db
      .prepare('SELECT * FROM fans WHERE LOWER(name) LIKE LOWER(?) ORDER BY updated_at DESC')
      .all(`%${query}%`) as FanRow[]
    return rows.map(rowToFan)
  }
}

// Singleton instance
let fanRepository: FanRepository | null = null

export function getFanRepository(): FanRepository {
  if (!fanRepository) {
    fanRepository = new FanRepository()
  }
  return fanRepository
}

export function resetFanRepository(): void {
  fanRepository = null
}
