import { randomUUID } from 'node:crypto'
import { getDatabase } from '../db/database'
import type { PPVScript, Purchase } from './ppv-types'

interface PPVRow {
  id: string
  title: string
  content_text: string
  price: number
  category: string
  tags: string
  preview_text: string
  cta_type: string
  times_used: number
  created_at: string
}

interface PurchaseRow {
  id: string
  fan_id: string
  ppv_id: string
  price_paid: number
  discount_applied: number
  created_at: string
}

function rowToPPV(row: PPVRow): PPVScript {
  return {
    id: row.id,
    title: row.title,
    contentText: row.content_text,
    price: row.price,
    category: row.category,
    tags: JSON.parse(row.tags) as string[],
    previewText: row.preview_text,
    ctaType: row.cta_type as PPVScript['ctaType'],
    timesUsed: row.times_used,
    createdAt: new Date(row.created_at),
  }
}

function rowToPurchase(row: PurchaseRow): Purchase {
  return {
    id: row.id,
    fanId: row.fan_id,
    ppvId: row.ppv_id,
    pricePaid: row.price_paid,
    discountApplied: row.discount_applied,
    createdAt: new Date(row.created_at),
  }
}

/**
 * PPV Repository handles all database operations for PPV scripts and purchases.
 */
export class PPVRepository {
  /**
   * Get all PPV scripts
   */
  getAll(): PPVScript[] {
    const db = getDatabase()
    const rows = db.prepare('SELECT * FROM ppv_scripts ORDER BY created_at DESC').all() as PPVRow[]
    return rows.map(rowToPPV)
  }

  /**
   * Get PPV by ID
   */
  getById(id: string): PPVScript | null {
    const db = getDatabase()
    const row = db.prepare('SELECT * FROM ppv_scripts WHERE id = ?').get(id) as PPVRow | undefined
    return row ? rowToPPV(row) : null
  }

  /**
   * Get random PPV for offering
   */
  getRandom(): PPVScript | null {
    const db = getDatabase()
    const row = db.prepare('SELECT * FROM ppv_scripts ORDER BY RANDOM() LIMIT 1').get() as
      | PPVRow
      | undefined
    return row ? rowToPPV(row) : null
  }

  /**
   * Get PPVs not yet purchased by fan
   */
  getNotPurchasedByFan(fanId: string): PPVScript[] {
    const db = getDatabase()
    const rows = db
      .prepare(
        `SELECT * FROM ppv_scripts
       WHERE id NOT IN (SELECT ppv_id FROM purchases WHERE fan_id = ?)
       ORDER BY RANDOM()`
      )
      .all(fanId) as PPVRow[]
    return rows.map(rowToPPV)
  }

  /**
   * Increment times used counter
   */
  incrementTimesUsed(id: string): void {
    const db = getDatabase()
    db.prepare('UPDATE ppv_scripts SET times_used = times_used + 1 WHERE id = ?').run(id)
  }

  /**
   * Record a purchase
   */
  recordPurchase(purchase: {
    fanId: string
    ppvId: string
    pricePaid: number
    discountApplied: number
  }): Purchase {
    const db = getDatabase()
    const id = randomUUID()
    const now = new Date().toISOString()

    db.prepare(
      'INSERT INTO purchases (id, fan_id, ppv_id, price_paid, discount_applied, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, purchase.fanId, purchase.ppvId, purchase.pricePaid, purchase.discountApplied, now)

    // Increment times used
    this.incrementTimesUsed(purchase.ppvId)

    return {
      ...purchase,
      id,
      createdAt: new Date(now),
    }
  }

  /**
   * Get purchases by fan
   */
  getPurchasesByFan(fanId: string): Purchase[] {
    const db = getDatabase()
    const rows = db
      .prepare('SELECT * FROM purchases WHERE fan_id = ? ORDER BY created_at DESC')
      .all(fanId) as PurchaseRow[]
    return rows.map(rowToPurchase)
  }

  /**
   * Check if fan has purchased specific PPV
   */
  hasFanPurchased(fanId: string, ppvId: string): boolean {
    const db = getDatabase()
    const row = db
      .prepare('SELECT COUNT(*) as count FROM purchases WHERE fan_id = ? AND ppv_id = ?')
      .get(fanId, ppvId) as { count: number }
    return row.count > 0
  }

  /**
   * Create a new PPV script
   */
  create(ppv: Omit<PPVScript, 'id' | 'timesUsed' | 'createdAt'>): PPVScript {
    const db = getDatabase()
    const id = randomUUID()
    const now = new Date().toISOString()

    db.prepare(
      'INSERT INTO ppv_scripts (id, title, content_text, price, category, tags, preview_text, cta_type, times_used, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)'
    ).run(
      id,
      ppv.title,
      ppv.contentText,
      ppv.price,
      ppv.category,
      JSON.stringify(ppv.tags),
      ppv.previewText,
      ppv.ctaType,
      now
    )

    return {
      ...ppv,
      id,
      timesUsed: 0,
      createdAt: new Date(now),
    }
  }
}

// Singleton instance
let ppvRepository: PPVRepository | null = null

export function getPPVRepository(): PPVRepository {
  if (!ppvRepository) {
    ppvRepository = new PPVRepository()
  }
  return ppvRepository
}

export function resetPPVRepository(): void {
  ppvRepository = null
}
