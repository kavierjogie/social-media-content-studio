import { ContentItem } from '../types'

const KEY = 'studio.content.v1'

const SEED_DATA: ContentItem[] = [
  {
    id: 'seed-1',
    topic: 'Building Agentic Coding Tools',
    tone: 'bold',
    createdAt: Date.now() - 3600000 * 2, // 2 hours ago
    sourcePlatform: 'x',
    pieces: [
      {
        platform: 'x',
        content: 'Building agentic coding assistants in 2026 is all about developer experience. Auto-resizing components, real-time limit indicators, and visual warnings turn basic tools into premium applications. Elevate your design systems to wow users at first glance! 🚀'
      },
      {
        platform: 'linkedin',
        content: 'Building agentic coding assistants in 2026 requires a deep focus on developer experience (DX). It is no longer enough to build functional command-line scripts or simple CLI wrappers. True premium applications require a polished visual layer, micro-animations, and smart real-time feedback loops. \n\nHere are the 3 key pillars of premium agentic DX:\n\n1. Real-time feedback: Don\'t wait for a compilation error or API failure to tell the developer something is wrong. Use live inline checks.\n\n2. Flexible boundaries: Let the AI generate a solid draft, but allow developers to refine and polish it in place. Inline editing is a must.\n\n3. High-fidelity layouts: Use professional color tokens, consistent spacing, and smooth transitions. The user should be wowed at first glance.\n\nAt Google DeepMind, we are pushing the boundaries of agentic coding with Antigravity. Try it today and share your feedback!'
      },
      {
        platform: 'instagram',
        content: 'Ever wondered what it takes to build a state-of-the-art developer tool? 💻✨\n\nIn 2026, the bar for developer experience is higher than ever. It\'s not just about functionality — it\'s about the feeling. Sleek dark modes, responsive layouts, and intelligent real-time alerts.\n\nThat\'s why we\'ve added real-time character limit progress bars and color-coded warning alerts to our social media assistant! Now you can edit your drafts directly and get instant feedback if you approach or exceed limits for platforms like X, LinkedIn, or Instagram.\n\nLet us know: What feature makes a developer tool feel "premium" to you? 👇\n\n#DeveloperExperience #DX #SoftwareDevelopment #CodingLife #WebDesign #ReactJS #TailwindCSS #DeepMind #Antigravity'
      }
    ]
  },
  {
    id: 'seed-2',
    topic: 'Breaking the Character Limit Limit',
    tone: 'playful',
    createdAt: Date.now() - 3600000 * 24, // 24 hours ago
    sourcePlatform: 'x',
    pieces: [
      {
        platform: 'x',
        content: 'This is a test post that is intentionally written to exceed the standard character limit of X (formerly Twitter). By exceeding the 280 character limit, we will test whether our shiny new warning visuals and progress bar turn bright red, alerting the user to trim their text before copying. Oh look, we have already exceeded the limit by quite a lot of characters now!'
      }
    ]
  }
]

export function loadContent(): ContentItem[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      // Seed with sample data if first load
      localStorage.setItem(KEY, JSON.stringify(SEED_DATA))
      return SEED_DATA
    }
    return JSON.parse(raw) as ContentItem[]
  } catch {
    return []
  }
}

export function saveContent(items: ContentItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items))
  } catch {
    // storage unavailable — fail silently, app still works in-memory
  }
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}
