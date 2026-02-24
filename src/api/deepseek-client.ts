import * as dotenv from 'dotenv'
import * as path from 'node:path'
import {
  ChatMessage,
  ChatCompletionResponse,
  DeepseekConfig,
  DeepseekError,
} from './types'
import { withRetry } from './retry-handler'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const DEFAULT_BASE_URL = 'https://api.deepseek.com'
const DEFAULT_MODEL = 'deepseek-chat'

export class DeepseekClient {
  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly model: string

  constructor(config?: Partial<DeepseekConfig>) {
    this.apiKey = config?.apiKey ?? process.env.DEEPSEEK_API_KEY ?? ''
    this.baseUrl = config?.baseUrl ?? process.env.DEEPSEEK_BASE_URL ?? DEFAULT_BASE_URL
    this.model = config?.model ?? process.env.DEEPSEEK_MODEL ?? DEFAULT_MODEL

    if (!this.apiKey) {
      throw new DeepseekError(
        'DEEPSEEK_API_KEY is required. Set it in .env file or pass it in config.',
        undefined,
        false
      )
    }
  }

  async chat(
    messages: ChatMessage[],
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<string> {
    const response = await this.createChatCompletion(messages, options)
    return response.choices[0]?.message.content ?? ''
  }

  async createChatCompletion(
    messages: ChatMessage[],
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<ChatCompletionResponse> {
    return withRetry(async () => {
      const url = `${this.baseUrl}/chat/completions`

      const body = {
        model: this.model,
        messages,
        temperature: options?.temperature ?? 0.8,
        max_tokens: options?.maxTokens ?? 500,
        stream: false,
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new DeepseekError(
          `Deepseek API error: ${response.status} - ${errorText}`,
          response.status,
          response.status >= 500 || response.status === 429
        )
      }

      return (await response.json()) as ChatCompletionResponse
    })
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.chat([
        { role: 'user', content: 'Say "OK" if you can hear me.' },
      ])
      return response.includes('OK')
    } catch {
      return false
    }
  }
}

// Singleton instance
let client: DeepseekClient | null = null

export function getDeepseekClient(): DeepseekClient {
  if (!client) {
    client = new DeepseekClient()
  }
  return client
}

export function resetDeepseekClient(): void {
  client = null
}
