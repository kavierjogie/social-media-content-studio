import { ReactNode } from 'react'

type Accent = 'purple' | 'pink' | 'orange' | 'neutral'

const accentClasses: Record<Accent, string> = {
  purple: 'bg-signal-purple/15 text-violet-300 border-signal-purple/30',
  pink: 'bg-signal-pink/15 text-pink-300 border-signal-pink/30',
  orange: 'bg-signal-orange/15 text-orange-300 border-signal-orange/30',
  neutral: 'bg-white/5 text-mist-300 border-white/10'
}

export default function Badge({ children, accent = 'neutral' }: { children: ReactNode; accent?: Accent }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-mono tracking-wide ${accentClasses[accent]}`}>
      {children}
    </span>
  )
}
