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
  private selectedModel: string | null = null

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

  async selectBestModel(apiKey: string): Promise<string> {
    if (this.selectedModel) {
      return this.selectedModel
    }

    const defaultModel = 'llama-3.3-70b-versatile'
    try {
      console.log('Fetching available models from Groq API...')
      const response = await fetch('https://api.groq.com/openai/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.warn(`Groq models endpoint returned status ${response.status}. Using default model: ${defaultModel}`)
        return defaultModel
      }

      const data = await response.json()
      const availableModels: string[] = data.data?.map((m: any) => m.id) || []
      console.log('Available Groq models:', availableModels)
      
      const PREFERRED_GROQ_MODELS = [
        'llama-3.3-70b-versatile',
        'llama-3.3-70b-specdec',
        'deepseek-r1-distill-llama-70b',
        'deepseek-r1-distill-qwen-32b',
        'mixtral-8x7b-32768',
        'llama-3.1-8b-instant',
        'llama-3.1-70b-versatile',
        'gemma2-9b-it',
        'llama-3.2-3b-preview',
        'llama-3.2-11b-vision-preview'
      ]

      for (const modelId of PREFERRED_GROQ_MODELS) {
        if (availableModels.includes(modelId)) {
          this.selectedModel = modelId
          console.log(`Dynamically selected Groq model: ${modelId}`)
          return modelId
        }
      }

      // If none of our preferred models are found, find any text-generation model
      const textModel = availableModels.find(id => 
        !id.includes('whisper') && 
        !id.includes('guard') && 
        !id.includes('vision')
      )

      if (textModel) {
        this.selectedModel = textModel
        console.log(`No preferred model matched. Dynamically selected Groq text model: ${textModel}`)
        return textModel
      }

      // Final fallback if list is empty or unrecognized
      const fallback = availableModels[0] || defaultModel
      this.selectedModel = fallback
      console.log(`Using fallback Groq model: ${fallback}`)
      return fallback
    } catch (err) {
      console.warn('Failed to fetch Groq models list, falling back to default:', err)
      return defaultModel
    }
  }

  async generate(prompt: string): Promise<string> {
    const apiKey = this.getApiKey()
    if (!apiKey) {
      throw new Error('API key is missing.')
    }

    const modelToUse = await this.selectBestModel(apiKey)
    const url = 'https://api.groq.com/openai/v1/chat/completions'

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
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

// Registry of available AI Providers (primary first, then fallback)
export const providers: AIProvider[] = [
  new GeminiProvider(),
  new GroqProvider()
]

export async function callAI(prompt: string): Promise<string> {
  const errors: string[] = []
  
  // Find all configured providers
  const activeProviders = providers.filter(p => p.isConfigured())
  
  if (activeProviders.length === 0) {
    throw new Error(
      'AI generation failed: No AI providers are configured.\n' +
      '- Google Gemini: API key is not configured.\n' +
      '- Groq: API key is not configured.\n\n' +
      'Please enter your API keys in the settings or set them in the environment.'
    )
  }
  
  for (const provider of activeProviders) {
    try {
      console.log(`Attempting AI generation with provider: ${provider.name}`)
      const result = await provider.generate(prompt)
      return result
    } catch (err: any) {
      const errMsg = err.message || err.toString()
      console.warn(`${provider.name} generation failed. Error: ${errMsg}`)
      errors.push(`${provider.name}: ${errMsg}`)
    }
  }
  
  // If all failed, throw a combined error
  throw new Error(
    `AI generation failed for all configured providers:\n` +
    errors.map((e) => `- ${e}`).join('\n') +
    `\n\nPlease check your API keys in the settings or environment.`
  )
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
