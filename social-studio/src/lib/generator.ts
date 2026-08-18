import { GeneratedPiece, Platform } from '../types'

// Retrieve the Gemini API key from Vite environment or localStorage
function getApiKey(): string | null {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY
  if (envKey && envKey.trim()) return envKey.trim()

  const localKey = localStorage.getItem('studio.gemini_api_key')
  if (localKey && localKey.trim()) return localKey.trim()

  return null
}

const PLATFORM_INSTRUCTIONS: Record<Platform, string> = {
  blog: `Write a detailed, structured, long-form blog article. Format with Markdown. 
Include an attention-grabbing Title, Introduction, a few well-defined sections (using H2 and H3 headings), bullet points or numbered lists where appropriate, and a conclusion/key takeaway.`,
  
  linkedin: `Write a professional, value-packed LinkedIn post. 
- Start with a compelling hook in the first line.
- Use generous line spacing (short paragraphs of 1-2 sentences) for readability.
- Provide 3-4 clear, actionable key takeaways using arrows or bullet points (e.g. • or →).
- End with an engaging question that drives professional discussion in comments.
- Do not use too many hashtags (max 3). Keep it professional and insightful.`,
  
  instagram: `Write an engaging, personal, and friendly Instagram caption.
- Start with a strong, scroll-stopping hook line.
- Use emojis throughout for visual texture.
- Keep paragraphs short and clean.
- Include a clear call to action (e.g., "Save this post for later!", "Let me know your thoughts in the comments").
- Include 5-10 relevant hashtags at the very bottom.`,
  
  tiktok: `Write a short, engaging shot-by-shot TikTok video script.
Format with clear labels indicating:
- [HOOK — 0:00-0:03]: On-screen text suggestions and energetic voiceover.
- [CONTEXT — 0:03-0:10]: Visual direction and voiceover.
- [PAYOFF — 0:10-0:20]: Value payload details, visuals, and voiceover.
- [CTA — 0:20-0:25]: Outro visual and high-energy voiceover call to follow or click the link.
Make it punchy, trendy, and conversational.`,
  
  x: `Write a sharp, high-impact post for X (formerly Twitter). 
- State a single, powerful, and thought-provoking idea.
- Keep it extremely concise. 
- MUST be strictly under 280 characters in length. No hashtags.`,
  
  promo: `Write high-converting, persuasive promotional copy.
- Lead with an exciting reveal or solution.
- Clearly present the benefits, offer, or features.
- Build urgency or excitement.
- End with a strong, clear call-to-action (CTA).`,
  
  hashtags: `Generate a list of 10-15 highly relevant, trending hashtags.
- DO NOT write any introductory, conversational, or explaining text.
- ONLY output the hashtags separated by spaces (e.g. #Marketing #Strategy).`,

  calendar: `Generate a structured weekly content calendar plan.
- Map out a 7-day schedule (Day 1 to Day 7).
- For each day, suggest: the recommended platform (e.g., LinkedIn, Instagram), the format (e.g., Carousel, Story, Short-form text), and a specific content angle/hook idea.
- Format this as a clean, readable Markdown layout (such as a table or a clear list).`
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error('Gemini API key is missing. Please set VITE_GEMINI_API_KEY in your .env file or input it in the UI.')
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

export async function generateForPlatform(
  topic: string,
  platform: Platform,
  tone: string,
  existingPieces?: GeneratedPiece[]
): Promise<string> {
  const context = existingPieces && existingPieces.length > 0
    ? `Here is the existing content generated for this idea:\n` +
      existingPieces.map(p => `[${p.platform.toUpperCase()}]:\n${p.content}`).join('\n\n')
    : ''

  const promptText = `
You are an expert social media marketer and content strategist.
We have an idea/topic: "${topic}" (Tone: "${tone}").
${context ? `We have already generated the following content for other platforms:\n\n${context}\n\n` : ''}
Generate a new, consistent version for the following target platform: ${platform.toUpperCase()}.

Format Guidelines for ${platform}:
${PLATFORM_INSTRUCTIONS[platform]}

Do not add intro/outro comments or formatting metadata wrapper. Return ONLY the final output content for ${platform}.
`

  return callGemini(promptText)
}

export async function transformContent(
  topic: string,
  targets: Platform[],
  tone: string,
  existingPieces?: GeneratedPiece[]
): Promise<GeneratedPiece[]> {
  const promises = targets.map(async (platform) => {
    const content = await generateForPlatform(topic, platform, tone, existingPieces)
    return {
      platform,
      content
    }
  })
  return Promise.all(promises)
}

export async function regenerateForPlatform(
  topic: string,
  platform: Platform,
  tone: string,
  currentContent: string,
  instruction: string,
  existingPieces?: GeneratedPiece[]
): Promise<string> {
  const otherContext = existingPieces && existingPieces.length > 0
    ? `Here is the other content generated for this idea (for context consistency):\n` +
      existingPieces.filter(p => p.platform !== platform).map(p => `[${p.platform.toUpperCase()}]:\n${p.content}`).join('\n\n')
    : ''

  const promptText = `
You are an expert social media marketer and content strategist.
We have an idea/topic: "${topic}" (Tone: "${tone}").

We already generated a draft for the ${platform.toUpperCase()} platform, but the user wants to refine/rewrite it.

Current draft for ${platform.toUpperCase()}:
"""
${currentContent}
"""

The user's refinement instruction is: "${instruction}"

${otherContext ? `Other platforms' content for context:\n\n${otherContext}\n\n` : ''}

Please rewrite the ${platform.toUpperCase()} post according to the user's instruction.
Keep the rewrite consistent with the target platform guidelines.

Format Guidelines for ${platform}:
${PLATFORM_INSTRUCTIONS[platform]}

Do not add intro/outro comments or formatting metadata wrapper. Return ONLY the final revised output content for ${platform}.
`

  return callGemini(promptText)
}

