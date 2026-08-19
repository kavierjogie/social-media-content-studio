export interface AIProvider {
  id: string
  name: string
  generate(prompt: string): Promise<string>
  isConfigured(): boolean
}

export class GeminiProvider implements AIProvider {
  id = 'gemini'
  name = 'Google Gemini'

  getApiKey(): string | null {
    const envKey = import.meta.env.VITE_GEMINI_API_KEY
    if (envKey && envKey.trim()) return envKey.trim()

    const localKey = localStorage.getItem('studio.gemini_api_key')
    if (localKey && localKey.trim()) return localKey.trim()

    return null
  }

  isConfigured(): boolean {
    return !!this.getApiKey()
  }

  async generate(prompt: string): Promise<string> {
    const apiKey = this.getApiKey()
    if (!apiKey) {
      throw new Error('API key is missing.')
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7
        }
      })
    })

    if (!response.ok) {
      let errorMsg = `API request failed with status ${response.status}`
      try {
        const errData = await response.json()
        if (errData?.error?.message) {
          errorMsg = errData.error.message
        }
      } catch {
        // ignore json parsing errors
      }
      throw new Error(errorMsg)
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      throw new Error('No content returned from the Gemini API.')
    }

    return text.trim()
  }
}

export class GroqProvider implements AIProvider {
  id = 'groq'
  name = 'Groq'
  model = 'llama-3.3-70b-versatile'

  getApiKey(): string | null {
    const envKey = import.meta.env.VITE_GROQ_API_KEY
    if (envKey && envKey.trim()) return envKey.trim()

    const localKey = localStorage.getItem('studio.groq_api_key')
    if (localKey && localKey.trim()) return localKey.trim()

    return null
  }

  isConfigured(): boolean {
    return !!this.getApiKey()
  }

  async generate(prompt: string): Promise<string> {
    const apiKey = this.getApiKey()
    if (!apiKey) {
      throw new Error('API key is missing.')
    }

    const url = 'https://api.groq.com/openai/v1/chat/completions'

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7
      })
    })

    if (!response.ok) {
      let errorMsg = `API request failed with status ${response.status}`
      try {
        const errData = await response.json()
        if (errData?.error?.message) {
          errorMsg = errData.error.message
        }
      } catch {
        // ignore json parsing errors
      }
      throw new Error(errorMsg)
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content

    if (!text) {
      throw new Error('No content returned from the Groq API.')
    }

    return text.trim()
  }
}

const gemini = new GeminiProvider()
const groq = new GroqProvider()

export async function callAI(prompt: string): Promise<string> {
  const errors: string[] = []

  // Try Gemini first if configured
  if (gemini.isConfigured()) {
    try {
      return await gemini.generate(prompt)
    } catch (err: any) {
      const errMsg = err.message || err.toString()
      console.warn(`Google Gemini generation failed, attempting fallback to Groq. Error: ${errMsg}`)
      errors.push(`Google Gemini: ${errMsg}`)
    }
  } else {
    errors.push('Google Gemini: API key is not configured.')
  }

  // Fallback to Groq if configured
  if (groq.isConfigured()) {
    try {
      return await groq.generate(prompt)
    } catch (err: any) {
      const errMsg = err.message || err.toString()
      console.error(`Groq generation failed. Error: ${errMsg}`)
      errors.push(`Groq: ${errMsg}`)
    }
  } else {
    errors.push('Groq: API key is not configured.')
  }

  // If both failed or were not configured, throw a combined error
  throw new Error(
    `AI generation failed for all configured providers:\n` +
    errors.map((e) => `- ${e}`).join('\n') +
    `\n\nPlease check your API keys in the settings or environment.`
  )
}
