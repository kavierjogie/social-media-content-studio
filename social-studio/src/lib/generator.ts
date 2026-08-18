import { GeneratedPiece, Platform } from '../types'

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

const toneWord = (tone: string) => {
  switch (tone) {
    case 'bold':
      return { hook: 'Here\'s the truth about', close: 'No fluff. Just results.' }
    case 'playful':
      return { hook: 'Okay, let\'s talk about', close: 'Tell us we\'re not wrong.' }
    case 'formal':
      return { hook: 'A closer look at', close: 'We welcome your perspective.' }
    default:
      return { hook: 'Let\'s talk about', close: 'What\'s your take?' }
  }
}

const slugWords = (topic: string) =>
  topic
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)

export function generateHashtags(topic: string): string {
  const words = slugWords(topic)
  const base = words.map((w) => `#${w}`)
  const broad = ['#SmallBusiness', '#ContentCreator', '#MarketingTips', '#GrowthStrategy', '#BrandBuilding']
  const niche = words.length
    ? [`#${words.join('')}`, `#${words[0]}Tips`, `#${words[words.length - 1] ?? words[0]}Life`]
    : []
  const set = Array.from(new Set([...base, ...niche, ...pickN(broad, 4)]))
  return set.slice(0, 12).join(' ')
}

function pickN<T>(arr: T[], n: number): T[] {
  const copy = [...arr]
  const out: T[] = []
  while (out.length < Math.min(n, copy.length)) {
    const i = Math.floor(Math.random() * copy.length)
    out.push(copy.splice(i, 1)[0])
  }
  return out
}

function blog(topic: string, tone: string): string {
  const t = toneWord(tone)
  return [
    `${cap(topic)}: What It Actually Takes`,
    '',
    `${t.hook} ${topic}. It's easy to treat this as a checkbox, but the businesses that get it right treat it as a system, not a single post.`,
    '',
    '## Why it matters',
    `${cap(topic)} shows up in how customers find you, decide to trust you, and choose to come back. Skipping the fundamentals costs more time later than doing it right now.`,
    '',
    '## Where to start',
    `1. Get clear on the one outcome you want from ${topic}.`,
    '2. Write down the specific audience you\'re speaking to — not "everyone."',
    '3. Ship a small version this week instead of a perfect version next month.',
    '',
    '## The takeaway',
    `${cap(topic)} rewards consistency over intensity. Small, repeated actions beat a single big push. ${t.close}`
  ].join('\n')
}

function linkedin(topic: string, tone: string): string {
  const t = toneWord(tone)
  return [
    `${t.hook} ${topic}.`,
    '',
    `Most teams treat it as an afterthought — until it becomes the reason a deal, a hire, or a launch doesn't land the way it should.`,
    '',
    `Here's what's worked for us:`,
    `→ Start with the outcome, not the channel.`,
    `→ Keep the first version small and ship it fast.`,
    `→ Review what actually moved the needle, not what felt productive.`,
    '',
    `${cap(topic)} isn't a one-time project. It's a habit.`,
    '',
    `${t.close}`
  ].join('\n')
}

function instagram(topic: string, tone: string): string {
  const t = toneWord(tone)
  const emojiSets = ['✨', '🔥', '🌱', '💜', '📌']
  return [
    `${pick(emojiSets)} ${t.hook} ${topic} ${pick(emojiSets)}`,
    '',
    `We could talk about this all day — but here's the short version:`,
    `${cap(topic)} works best when it's simple, honest, and consistent.`,
    '',
    `Save this for later, and tag someone who needs to see it. ${t.close}`,
    '',
    generateHashtags(topic)
  ].join('\n')
}

function tiktok(topic: string, tone: string): string {
  const t = toneWord(tone)
  return [
    `[HOOK — 0:00-0:03]`,
    `On-screen text: "${cap(topic)}? Here's what nobody tells you."`,
    `VO: ${t.hook} ${topic} — and why most people get it wrong.`,
    '',
    `[CONTEXT — 0:03-0:10]`,
    `On-screen text: The mistake`,
    `VO: Most people treat this as a one-off. It's not. It's a system.`,
    '',
    `[PAYOFF — 0:10-0:20]`,
    `On-screen text: What to do instead`,
    `VO: Start small, ship weekly, and track what actually moves the number that matters.`,
    '',
    `[CTA — 0:20-0:25]`,
    `On-screen text: Follow for more`,
    `VO: ${t.close}`
  ].join('\n')
}

function x(topic: string, tone: string): string {
  const t = toneWord(tone)
  const variants = [
    `${t.hook} ${topic}: most people overthink it. Start small, ship this week, iterate from real feedback. ${t.close}`,
    `Unpopular opinion: ${topic} doesn't need a perfect plan. It needs a first version and a Tuesday.`,
    `${cap(topic)} in one line: consistency beats intensity, every time.`
  ]
  return pick(variants)
}

function promo(topic: string, tone: string): string {
  const t = toneWord(tone)
  return [
    `${cap(topic)} is here — for a limited time.`,
    '',
    `${t.hook} what changes when you finally get this right: less guesswork, more consistent results, and a process your whole team can follow.`,
    '',
    `This week only, we're making it easier to start.`,
    '',
    `→ Get started today.`
  ].join('\n')
}

export function generateForPlatform(topic: string, platform: Platform, tone: string): string {
  switch (platform) {
    case 'blog':
      return blog(topic, tone)
    case 'linkedin':
      return linkedin(topic, tone)
    case 'instagram':
      return instagram(topic, tone)
    case 'tiktok':
      return tiktok(topic, tone)
    case 'x':
      return x(topic, tone)
    case 'promo':
      return promo(topic, tone)
    case 'hashtags':
      return generateHashtags(topic)
    default:
      return `${cap(topic)}`
  }
}

export function transformContent(
  topic: string,
  targets: Platform[],
  tone: string
): GeneratedPiece[] {
  return targets.map((platform) => ({
    platform,
    content: generateForPlatform(topic, platform, tone)
  }))
}
