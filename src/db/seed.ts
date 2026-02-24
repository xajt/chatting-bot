import { getDatabase } from './database'
import { randomUUID } from 'node:crypto'

interface PPVSeed {
  id: string
  title: string
  content_text: string
  price: number // in cents
  category: string
  tags: string[]
  preview_text: string
  cta_type: string
}

const PPV_SEEDS: Omit<PPVSeed, 'id'>[] = [
  {
    title: 'Morning Shower',
    content_text:
      'Started my day with a steamy shower... the hot water running down my body got me thinking about you watching me. The way the soap slid down my curves... wish you were there to help me reach those hard-to-get spots 🥺',
    price: 1500, // $15.00
    category: 'teasing',
    tags: ['shower', 'morning', 'teasing', 'soap'],
    preview_text: 'Steamy morning shower video...',
    cta_type: 'video_question',
  },
  {
    title: 'Bedroom Antics',
    content_text:
      'So I was just lying in bed, scrolling through my phone, wearing nothing but your favorite oversized shirt... and my mind started wandering. Next thing I know, my hands are exploring places they shouldn\'t be while thinking about what you\'d do if you walked in right now...',
    price: 2500, // $25.00
    category: 'solo',
    tags: ['bedroom', 'solo', 'teasing', 'imagination'],
    preview_text: 'What happens when I\'m alone in bed...',
    cta_type: 'if_you_were_here',
  },
  {
    title: 'Workout Flash',
    content_text:
      'Just finished my home workout and WOW I\'m sweaty 😅 But also... kinda turned on? There\'s something about all that physical exertion that gets my blood pumping in ALL the right places. Caught a glimpse of myself in the mirror and honestly... I looked pretty hot all flushed and breathing heavy 💦',
    price: 2000, // $20.00
    category: 'fitness',
    tags: ['workout', 'sweaty', 'fitness', 'mirror'],
    preview_text: 'Post-workout glow up...',
    cta_type: 'gamification',
  },
  {
    title: 'Late Night Thoughts',
    content_text:
      'It\'s 2am and I can\'t sleep. My mind keeps going to... places. You know those nights where you\'re just laying there and every thought makes you more and more worked up? Yeah, that\'s me right now. Made a little something to help me (and maybe you?) relax...',
    price: 3500, // $35.00
    category: 'intimate',
    tags: ['night', 'intimate', 'solo', 'relaxing'],
    preview_text: 'What keeps me up at night...',
    cta_type: 'fomo',
  },
  {
    title: 'Naughty Cooking',
    content_text:
      'Tried following a recipe but got distracted thinking about you. Let\'s just say things got messy in the kitchen... and I\'m not talking about the food. There was whipped cream involved and... well, you\'ll have to see what happened next 😏',
    price: 3000, // $30.00
    category: 'fun',
    tags: ['cooking', 'messy', 'whipped-cream', 'playful'],
    preview_text: 'Things got hot in the kitchen...',
    cta_type: 'soft',
  },
]

export function runSeed(): void {
  const db = getDatabase()

  console.log('Seeding PPV scripts...')

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO ppv_scripts (id, title, content_text, price, category, tags, preview_text, cta_type, times_used)
    VALUES (@id, @title, @content_text, @price, @category, @tags, @preview_text, @cta_type, 0)
  `)

  const insertMany = db.transaction((ppvs: PPVSeed[]) => {
    for (const ppv of ppvs) {
      insertStmt.run({
        ...ppv,
        tags: JSON.stringify(ppv.tags),
      })
    }
  })

  const ppvsWithIds: PPVSeed[] = PPV_SEEDS.map((ppv) => ({
    ...ppv,
    id: randomUUID(),
  }))

  insertMany(ppvsWithIds)

  console.log(`Seeded ${ppvsWithIds.length} PPV scripts`)

  // Verify
  const count = db.prepare('SELECT COUNT(*) as count FROM ppv_scripts').get() as {
    count: number
  }
  console.log(`Total PPV scripts in database: ${count.count}`)
}

// Run seed if called directly
if (process.argv[1]?.endsWith('seed.ts')) {
  // Ensure migrations run first
  const { runMigrations } = require('./migrations')
  runMigrations()
  runSeed()
  console.log('Seed completed successfully')
}
