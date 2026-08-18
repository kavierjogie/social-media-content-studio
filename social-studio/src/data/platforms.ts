import { PlatformMeta } from '../types'

export const PLATFORMS: PlatformMeta[] = [
  {
    id: 'blog',
    label: 'Blog article',
    accent: 'purple',
    description: 'Long-form piece with a headline and structured sections.'
  },
  {
    id: 'linkedin',
    label: 'LinkedIn post',
    accent: 'purple',
    charLimit: 3000,
    description: 'Professional framing with a takeaway and a discussion prompt.'
  },
  {
    id: 'instagram',
    label: 'Instagram caption',
    accent: 'pink',
    charLimit: 2200,
    description: 'Warm, visual-first caption with a hook and hashtags.'
  },
  {
    id: 'tiktok',
    label: 'TikTok script',
    accent: 'pink',
    description: 'Shot-by-shot script with on-screen text and a hook line.'
  },
  {
    id: 'x',
    label: 'X post',
    accent: 'pink',
    charLimit: 280,
    description: 'Sharp, single-thought post built for replies and reposts.'
  },
  {
    id: 'promo',
    label: 'Promotional copy',
    accent: 'orange',
    description: 'Conversion-focused copy for an offer, launch, or CTA.'
  },
  {
    id: 'hashtags',
    label: 'Hashtag set',
    accent: 'orange',
    description: 'A ready-to-paste set of reach and niche hashtags.'
  }
]

export const platformMeta = (id: string) =>
  PLATFORMS.find((p) => p.id === id) ?? PLATFORMS[0]
