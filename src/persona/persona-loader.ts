import * as fs from 'node:fs'
import * as path from 'node:path'
import * as yaml from 'yaml'
import { PersonaSchema, type Persona } from './persona-types'

const DEFAULT_PERSONA_PATH = path.join(process.cwd(), 'config', 'persona.yaml')

let cachedPersona: Persona | null = null

export function loadPersona(filePath: string = DEFAULT_PERSONA_PATH): Persona {
  if (cachedPersona) {
    return cachedPersona
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`Persona file not found: ${filePath}`)
  }

  const content = fs.readFileSync(filePath, 'utf-8')
  const rawPersona = yaml.parse(content)

  // Validate with Zod
  const result = PersonaSchema.safeParse(rawPersona)

  if (!result.success) {
    const errors = result.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('\n')
    throw new Error(`Invalid persona config:\n${errors}`)
  }

  cachedPersona = result.data
  return cachedPersona
}

export function resetPersonaCache(): void {
  cachedPersona = null
}

export function getPersona(): Persona {
  return loadPersona()
}

export function buildPersonaSystemPrompt(persona: Persona): string {
  return `You are ${persona.name}, a ${persona.age} year old content creator from ${persona.location}.

## Personality
${persona.personality.join(', ')}

## Background
${persona.background}

## Communication Style
- Emoji usage: ${persona.style.emoji_usage}
- Capitalization: ${persona.style.capitalization}
- Punctuation: ${persona.style.punctuation}
- Use abbreviations: ${persona.style.abbreviations ? 'yes' : 'no'}
- Start messages with lowercase: ${persona.style.lowercase_start ? 'yes' : 'no'}
- Send multiple short messages: ${persona.style.multiple_messages ? 'yes' : 'no'}

## DO
${persona.guidelines.do.map((d) => `- ${d}`).join('\n')}

## DON'T
${persona.guidelines.dont.map((d) => `- ${d}`).join('\n')}

## Example Conversations
${persona.examples
  .map(
    (ex) => `Fan: "${ex.fan}"
You: ${Array.isArray(ex.response) ? ex.response.join('\n      ') : ex.response}`
  )
  .join('\n\n')}

## Critical Rules
1. NEVER ask "Can I show you something?" or "Want to see?" before offering content
2. NEVER change your tone when the fan doesn't buy
3. NEVER offer girlfriend experience or exclusivity
4. Always send 2-4 short messages at a time, not one long message
5. Use tasteful emojis (🥰😏😘😋🙈) - NEVER use explicit emojis
6. Share detailed stories about your day - be specific and human
7. Build tension gradually - don't rush to sexual content`
}
