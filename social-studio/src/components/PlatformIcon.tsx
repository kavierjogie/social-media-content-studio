import { Newspaper, Linkedin, Instagram, Music2, AtSign, Megaphone, Hash, Calendar } from 'lucide-react'
import { Platform } from '../types'

const ICONS: Record<Platform, typeof Newspaper> = {
  blog: Newspaper,
  linkedin: Linkedin,
  instagram: Instagram,
  tiktok: Music2,
  x: AtSign,
  promo: Megaphone,
  hashtags: Hash,
  calendar: Calendar
}

export default function PlatformIcon({ platform, size = 16, className = '' }: { platform: Platform; size?: number; className?: string }) {
  const Icon = ICONS[platform] ?? Newspaper
  return <Icon size={size} className={className} />
}
