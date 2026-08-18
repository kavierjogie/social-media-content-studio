import { Linkedin, Instagram, Music2, AtSign, Newspaper } from 'lucide-react'

const targets = [
  { Icon: Linkedin, y: 40, color: '#8B5CF6' },
  { Icon: Instagram, y: 100, color: '#EC4899' },
  { Icon: Music2, y: 160, color: '#EC4899' },
  { Icon: AtSign, y: 220, color: '#F97316' }
]

export default function PipelineSignature() {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl card-surface bg-grad-panel px-6 py-8">
      <svg viewBox="0 0 640 260" className="w-full h-auto" role="img" aria-label="One idea transforming into four platform-ready formats">
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="55%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#F97316" />
          </linearGradient>
        </defs>

        {/* source node */}
        <g>
          <circle cx="60" cy="130" r="34" fill="#1A1128" stroke="#8B5CF6" strokeWidth="1.5" />
          <circle cx="60" cy="130" r="34" fill="url(#lineGrad)" opacity="0.12" />
          <text x="60" y="126" textAnchor="middle" fontSize="11" fill="#EFE9F7" fontFamily="Space Grotesk, sans-serif" fontWeight="600">
            YOUR
          </text>
          <text x="60" y="140" textAnchor="middle" fontSize="11" fill="#EFE9F7" fontFamily="Space Grotesk, sans-serif" fontWeight="600">
            IDEA
          </text>
        </g>

        {/* connecting lines */}
        {targets.map((t, i) => (
          <path
            key={i}
            d={`M94,130 C220,130 220,${t.y} 330,${t.y}`}
            fill="none"
            stroke="url(#lineGrad)"
            strokeWidth="1.5"
            strokeDasharray="6 6"
            className="animate-flow"
            opacity="0.55"
          />
        ))}

        {/* platform nodes */}
        {targets.map((t, i) => (
          <g key={i} transform={`translate(330, ${t.y})`}>
            <circle r="22" fill="#120B1E" stroke={t.color} strokeWidth="1.5" />
            <circle r="3" fill={t.color} className="animate-pulseDot" style={{ transformOrigin: `0px 0px`, animationDelay: `${i * 0.3}s` }} cx="-40" />
          </g>
        ))}

        {/* icons rendered via foreignObject for crisp lucide icons */}
        {targets.map((t, i) => (
          <foreignObject key={`fo-${i}`} x={330 - 11} y={t.y - 11} width="22" height="22">
            <div style={{ color: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22 }}>
              <t.Icon size={14} />
            </div>
          </foreignObject>
        ))}

        <foreignObject x={60 - 11} y={130 - 11} width="22" height="22">
          <div style={{ color: '#C4B5FD', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22 }}>
            <Newspaper size={13} />
          </div>
        </foreignObject>

        {/* end labels */}
        {targets.map((t, i) => (
          <text key={`label-${i}`} x="362" y={t.y + 4} fontSize="12" fill="#B8AECB" fontFamily="Inter, sans-serif">
            {i === 0 ? 'LinkedIn' : i === 1 ? 'Instagram' : i === 2 ? 'TikTok' : 'X'}
          </text>
        ))}
      </svg>
    </div>
  )
}
