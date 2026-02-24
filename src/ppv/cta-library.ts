import { type CTAType, type PowerDynamic } from '../persona/persona-types'

export interface CTAContext {
  fanName: string
  ppvTitle: string
  ppvPrice: number
  powerDynamic: PowerDynamic
}

/**
 * CTA Library provides call-to-action templates for PPV offers.
 * All CTAs are designed to be natural and non-pushy.
 */
export class CTALibrary {
  private readonly templates: Record<CTAType, string[]> = {
    video_question: [
      "Could you resist if I did this right in front of you, {name}?",
      "How long do you think you could last watching this?",
      "Which part was your favorite - I bet I can guess",
      "Think you could handle watching the whole thing? 😏",
      "What would you do if you saw this live?",
    ],

    if_you_were_here: [
      "If you were here right now, what would you do first?",
      "If we were together, how would you wake me up?",
      "If you were here, would you help me pick out what to wear?",
      "If we showered together, would you try it my way?",
      "If you were here, what show would you put on for us?",
    ],

    follow_up: [
      "Now I've got another idea...",
      "Want to know what I'd do next?",
      "Oh wait, there's something else you might want to see",
      "Actually... I have more where that came from",
      "But that's not even the best part...",
    ],

    gamification: [
      "If you can watch this without finishing, I'll send you something special",
      "Give me your top 3 favorite things about this - I'm curious",
      "Bet you can't last the whole video 😏",
      "Challenge: tell me your favorite moment and I'll reward you",
      "Think you can handle round 2?",
    ],

    fomo: [
      "I might just unsend it... I'm nervous",
      "Get it before I change my mind 🙈",
      "I'll probably delete this in like 5 minutes",
      "Honestly not sure if I should keep this up...",
      "This might be too much, I might take it down",
    ],

    dominant: [
      "You will watch this and tell me your favorite parts.",
      "Prove you can handle it.",
      "Do it now. It better be good.",
      "I expect a full report after you watch.",
      "Don't disappoint me.",
    ],

    soft: [
      "Here's an idea, but totally up to you",
      "No pressure, just thought you might like it",
      "Just giving you the option if you want it",
      "Only if you're interested, no worries if not",
      "Thought of you when I made this 🥰",
    ],
  }

  /**
   * Get a random CTA of the specified type
   */
  getCTA(type: CTAType, context: CTAContext): string {
    const templates = this.templates[type]
    if (!templates || templates.length === 0) {
      return this.getCTA('soft', context) // Fallback to soft
    }

    const template = templates[Math.floor(Math.random() * templates.length)]!
    return this.fillTemplate(template, context)
  }

  /**
   * Get appropriate CTA based on phase and power dynamic
   */
  getAppropriateCTA(context: CTAContext): string {
    const { powerDynamic } = context

    // Select CTA type based on power dynamic
    let ctaType: CTAType

    switch (powerDynamic) {
      case 'dominant':
        ctaType = Math.random() > 0.5 ? 'dominant' : 'gamification'
        break
      case 'submissive':
        ctaType = Math.random() > 0.5 ? 'soft' : 'fomo'
        break
      default:
        // For neutral, use variety
        const neutralTypes: CTAType[] = [
          'video_question',
          'if_you_were_here',
          'gamification',
          'soft',
        ]
        ctaType = neutralTypes[Math.floor(Math.random() * neutralTypes.length)]!
    }

    return this.getCTA(ctaType, context)
  }

  /**
   * Get follow-up CTA for after a purchase
   */
  getFollowUpCTA(context: CTAContext): string {
    return this.getCTA('follow_up', context)
  }

  /**
   * Get FOMO CTA for hesitant fans
   */
  getFOMOCTA(context: CTAContext): string {
    return this.getCTA('fomo', context)
  }

  /**
   * Fill template placeholders with context
   */
  private fillTemplate(template: string, context: CTAContext): string {
    return template
      .replace(/{name}/g, context.fanName)
      .replace(/{title}/g, context.ppvTitle)
      .replace(/{price}/g, `$${(context.ppvPrice / 100).toFixed(0)}`)
  }

  /**
   * Get all available CTA types
   */
  getAvailableTypes(): CTAType[] {
    return Object.keys(this.templates) as CTAType[]
  }
}

// Singleton instance
let ctaLibrary: CTALibrary | null = null

export function getCTALibrary(): CTALibrary {
  if (!ctaLibrary) {
    ctaLibrary = new CTALibrary()
  }
  return ctaLibrary
}

export function resetCTALibrary(): void {
  ctaLibrary = null
}
