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
      const error = new Error(errorMsg) as any
      error.status = response.status
      throw error
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
  private selectedModel: string | null = null

  getApiKey(): string | null {
    // Check local storage first
    const localKey = localStorage.getItem('studio.groq_api_key')
    if (localKey && localKey.trim()) return localKey.trim()

    // Fallback to client-side env key if defined
    const envKey = import.meta.env.VITE_GROQ_API_KEY
    if (envKey && envKey.trim()) return envKey.trim()

    return null
  }

  isConfigured(): boolean {
    return !!this.getApiKey() || import.meta.env.VITE_GROQ_KEY_CONFIGURED === 'true'
  }

  async selectBestModel(apiKey: string | null): Promise<string> {
    if (this.selectedModel) {
      return this.selectedModel
    }

    const defaultModel = 'openai/gpt-oss-20b'
    try {
      const hasKey = !!apiKey && apiKey.trim().length > 0
      console.log(`GROQ_API_KEY detected: ${hasKey}`)
      console.log('Fetching available models from Groq API...')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`
      }

      const url = 'https://api.groq.com/openai/v1/models'
      const response = await fetch(url, {
        headers
      })

      if (!response.ok) {
        let responseBody = ''
        try {
          responseBody = await response.text()
        } catch {
          // ignore parsing error
        }

        if (response.status === 401) {
          console.error('[Groq API Key Config Issue] The Models API returned 401 Unauthorized. Please check your GROQ_API_KEY / environment variable configuration.')
        }

        const urlObj = new URL(url)
        console.warn(
          `[Groq Models Fetch Error]`,
          {
            hostname: urlObj.hostname,
            pathname: urlObj.pathname,
            method: 'GET',
            status: response.status,
            responseBody: responseBody || 'No response body'
          },
          `Using default model: ${defaultModel}`
        )
        return defaultModel
      }

      const data = await response.json()
      const availableModels: string[] = data.data?.map((m: any) => m.id) || []
      console.log('Available Groq models:', availableModels)
      
      // 9. For the first test, use llama-3.1-8b-instant if it appears in the available model list.
      if (availableModels.includes('llama-3.1-8b-instant')) {
        this.selectedModel = 'llama-3.1-8b-instant'
        console.log(`Dynamically selected preferred model: llama-3.1-8b-instant`)
        return 'llama-3.1-8b-instant'
      }

      const PREFERRED_GROQ_MODELS = [
        'openai/gpt-oss-20b',
        'openai/gpt-oss-120b',
        'groq/compound',
        'groq/compound-mini',
        'qwen/qwen3.6-27b',
        'allam-2-7b'
      ]

      for (const modelId of PREFERRED_GROQ_MODELS) {
        if (availableModels.includes(modelId)) {
          this.selectedModel = modelId
          console.log(`Dynamically selected Groq model: ${modelId}`)
          return modelId
        }
      }

      // If none of our preferred models are found, find any text-generation model.
      // Exclude audio, speech-to-text, text-to-speech, or Arabic-specific models.
      const textModels = availableModels.filter(id => {
        const idLower = id.toLowerCase()
        return (
          !idLower.includes('whisper') && 
          !idLower.includes('guard') && 
          !idLower.includes('vision') &&
          !idLower.includes('orpheus') &&
          !idLower.includes('arabic') &&
          !idLower.includes('saudi') &&
          !idLower.includes('tts') &&
          !idLower.includes('stt') &&
          !idLower.includes('canopylabs') &&
          !idLower.includes('audio') &&
          !idLower.includes('speech')
        )
      })

      if (textModels.length > 0) {
        const fallback = textModels.find(id => {
          const idLower = id.toLowerCase()
          return idLower.includes('llama') ||
                 idLower.includes('gemma') ||
                 idLower.includes('mixtral') ||
                 idLower.includes('deepseek') ||
                 idLower.includes('gpt')
        }) || textModels[0]

        this.selectedModel = fallback
        console.log(`No preferred model matched. Dynamically selected Groq text model: ${fallback}`)
        return fallback
      }

      // Final fallback if list is empty or unrecognized
      const fallback = availableModels[0] || defaultModel
      this.selectedModel = fallback
      console.log(`Using fallback Groq model: ${fallback}`)
      return fallback
    } catch (err: any) {
      console.warn('Failed to fetch Groq models list, falling back to default:', err.message || err)
      return defaultModel
    }
  }

  async generate(prompt: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('API key is missing.')
    }

    const apiKey = this.getApiKey()
    const modelToUse = await this.selectBestModel(apiKey)
    const url = 'https://api.groq.com/openai/v1/chat/completions'

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: modelToUse,
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
      const status = response.status
      let errorMsg = `API request failed with status ${status}`
      let responseBody = ''
      try {
        responseBody = await response.text()
        const errData = JSON.parse(responseBody)
        if (errData?.error?.message) {
          errorMsg = errData.error.message
        }
      } catch {
        // ignore json parsing errors
      }
      
      const urlObj = new URL(url)
      console.error(`[Groq Provider Error]`, {
        hostname: urlObj.hostname,
        pathname: urlObj.pathname,
        method: 'POST',
        status,
        responseBody: responseBody || errorMsg
      })
      const error = new Error(errorMsg) as any
      error.status = status
      throw error
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content

    if (!text) {
      throw new Error('No content returned from the Groq API.')
    }

    return text.trim()
  }
}

// 10. Make a completely independent Groq test request before using the fallback system.
export async function testGroqStandalone(apiKey: string | null, model: string): Promise<string> {
  const hasKey = !!apiKey && apiKey.trim().length > 0
  console.log(`GROQ_API_KEY detected: ${hasKey}`)

  const url = 'https://api.groq.com/openai/v1/chat/completions'
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'user',
          content: 'Reply with exactly: Groq is working.'
        }
      ]
    })
  })

  if (!response.ok) {
    const status = response.status
    let responseBody = ''
    try {
      responseBody = await response.text()
    } catch {
      // ignore
    }
    const urlObj = new URL(url)
    console.error(`[Groq Standalone Test Failed]`, {
      hostname: urlObj.hostname,
      pathname: urlObj.pathname,
      method: 'POST',
      status,
      responseBody: responseBody || 'No response body'
    })
    throw new Error(`Groq standalone test failed: Status ${status}. Response: ${responseBody || 'No body'}`)
  }

  const data = await response.json()
  const text = data.choices?.[0]?.message?.content
  if (!text) {
    throw new Error('Groq standalone test failed: No text returned in choices.')
  }
  return text.trim()
}

// Registry of available AI Providers (primary first, then fallback)
export const providers: AIProvider[] = [
  new GeminiProvider(),
  new GroqProvider()
]

export async function callAI(prompt: string): Promise<string> {
  const gemini = providers.find(p => p.id === 'gemini')
  const groq = providers.find(p => p.id === 'groq')

  const geminiConfigured = gemini?.isConfigured()
  const groqConfigured = groq?.isConfigured()

  if (!geminiConfigured && !groqConfigured) {
    throw new Error(
      'AI generation failed: No AI providers are configured.\n' +
      '- Google Gemini: API key is not configured.\n' +
      '- Groq: API key is not configured.\n\n' +
      'Please enter your API keys in the settings or set them in the environment.'
    )
  }

  if (geminiConfigured && gemini) {
    try {
      console.log(`Attempting AI generation with primary provider: ${gemini.name}`)
      const result = await gemini.generate(prompt)
      return result
    } catch (geminiErr: any) {
      const geminiErrMsg = geminiErr.message || geminiErr.toString()
      console.warn(`${gemini.name} generation failed (unavailable/quota exceeded). Error: ${geminiErrMsg}`)

      // Fall back to Groq for any Gemini failures (quota exceeded or unavailable)
      if (groqConfigured && groq) {
        console.log(`Falling back to Groq...`)
        try {
          const apiKey = (groq as GroqProvider).getApiKey()
          const modelToUse = await (groq as GroqProvider).selectBestModel(apiKey)
          
          console.log(`[Groq Standalone Test] Running test request...`)
          const testText = await testGroqStandalone(apiKey, modelToUse)
          console.log(`[Groq Standalone Test] Test succeeded! Response: "${testText}"`)

          // 15. If the standalone Groq test succeeds, connect that exact working implementation to the Gemini fallback.
          const result = await groq.generate(prompt)
          return result
        } catch (groqErr: any) {
          const groqErrMsg = groqErr.message || groqErr.toString()
          console.error(`Groq generation failed during fallback. Error: ${groqErrMsg}`)
          throw new Error(`Gemini failed: ${geminiErrMsg}\nFallback Groq also failed: ${groqErrMsg}`)
        }
      } else {
        throw new Error(`Gemini failed: ${geminiErrMsg}\nGroq is not configured as a fallback.`)
      }
    }
  } else if (groqConfigured && groq) {
    // If Gemini is not configured, fall back to Groq directly
    try {
      console.log(`Gemini is not configured. Attempting AI generation with Groq...`)
      
      const apiKey = (groq as GroqProvider).getApiKey()
      const modelToUse = await (groq as GroqProvider).selectBestModel(apiKey)
      
      console.log(`[Groq Standalone Test] Running test request...`)
      const testText = await testGroqStandalone(apiKey, modelToUse)
      console.log(`[Groq Standalone Test] Test succeeded! Response: "${testText}"`)

      const result = await groq.generate(prompt)
      return result
    } catch (err: any) {
      const errMsg = err.message || err.toString()
      console.error(`Groq generation failed. Error: ${errMsg}`)
      throw err
    }
  }

  throw new Error('No active AI providers available.')
}

// Expose test helper for testing providers in browser console
if (typeof window !== 'undefined') {
  (window as any).testProviders = async () => {
    console.log("--- Starting AI Providers Test ---");
    const testPrompt = "Write a one-sentence greeting.";
    
    for (const provider of providers) {
      console.log(`Testing provider: ${provider.name}`);
      console.log(`Configured: ${provider.isConfigured()}`);
      if (provider.isConfigured()) {
        try {
          const start = Date.now();
          const result = await provider.generate(testPrompt);
          console.log(`✓ ${provider.name} Success (${Date.now() - start}ms):`, result);
        } catch (err: any) {
          console.error(`✗ ${provider.name} Failed:`, err.message || err);
        }
      } else {
        console.log(`- ${provider.name} skipped (not configured)`);
      }
    }
    
    console.log("Testing callAI fallback mechanism...");
    try {
      const result = await callAI(testPrompt);
      console.log("✓ callAI Success:", result);
    } catch (err: any) {
      console.error("✗ callAI Failed:", err.message || err);
    }
    console.log("--- AI Providers Test Complete ---");
  };
}
