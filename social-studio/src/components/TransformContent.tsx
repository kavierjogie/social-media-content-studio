import { useEffect, useState } from 'react'
import { Repeat, Copy, Check } from 'lucide-react'
import Card from './ui/Card'
import Button from './ui/Button'
import PlatformIcon from './PlatformIcon'
import { PLATFORMS } from '../data/platforms'
import { ContentItem, Platform } from '../types'
import { transformContent } from '../lib/generator'

export default function TransformContent({
  items,
  activeItem,
  onUpdate
}: {
  items: ContentItem[]
  activeItem: ContentItem | null
  onUpdate: (item: ContentItem) => void
}) {
  const [selectedId, setSelectedId] = useState<string>(activeItem?.id ?? items[0]?.id ?? '')
  const [targets, setTargets] = useState<Platform[]>([])
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  useEffect(() => {
    if (activeItem) setSelectedId(activeItem.id)
  }, [activeItem])

  const current = items.find((i) => i.id === selectedId) ?? null
  const existingPlatforms = new Set(current?.pieces.map((p) => p.platform) ?? [])
  const available = PLATFORMS.filter((p) => !existingPlatforms.has(p.id))

  const toggle = (p: Platform) => {
    setTargets((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]))
  }

  const handleTransform = () => {
    if (!current || targets.length === 0) return
    const newPieces = transformContent(current.topic, targets, current.tone)
    const updated: ContentItem = { ...current, pieces: [...current.pieces, ...newPieces] }
    onUpdate(updated)
    setTargets([])
  }

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 1500)
    } catch {
      // clipboard unavailable
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-signal-pink">Transform content</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-mist-50">Nothing to transform yet</h1>
        <p className="mt-3 text-sm text-mist-400">
          Create a piece of content first, then come back here to turn it into more formats.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-signal-pink">Transform content</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-mist-50 sm:text-3xl">
          One idea, more platforms
        </h1>
        <p className="mt-2 max-w-xl text-sm text-mist-400">
          Pick a piece you've already created and generate the formats it's still missing.
        </p>
      </header>

      <Card className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-semibold text-mist-100">Source content</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-mist-50 focus:border-signal-pink/50"
          >
            {items.map((i) => (
              <option key={i.id} value={i.id} className="bg-ink-900">
                {i.topic}
              </option>
            ))}
          </select>
        </div>

        {current && (
          <>
            <div className="flex flex-wrap gap-1.5">
              {current.pieces.map((p) => (
                <span key={p.platform} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-mist-400">
                  <PlatformIcon platform={p.platform} size={12} />
                  {PLATFORMS.find((pl) => pl.id === p.platform)?.label}
                </span>
              ))}
            </div>

            {available.length > 0 ? (
              <div>
                <label className="mb-2 block text-sm font-semibold text-mist-100">Transform into</label>
                <div className="flex flex-wrap gap-2">
                  {available.map((p) => {
                    const active = targets.includes(p.id)
                    return (
                      <button
                        key={p.id}
                        onClick={() => toggle(p.id)}
                        className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition-colors ${
                          active
                            ? 'border-signal-orange/40 bg-signal-orange/15 text-orange-200'
                            : 'border-white/10 bg-white/[0.03] text-mist-400 hover:text-mist-100'
                        }`}
                      >
                        <PlatformIcon platform={p.id} size={14} />
                        {p.label}
                      </button>
                    )
                  })}
                </div>
                <Button intent="action" className="mt-4" onClick={handleTransform} disabled={targets.length === 0}>
                  <Repeat size={14} />
                  Transform
                </Button>
              </div>
            ) : (
              <p className="text-sm text-mist-400">This piece already exists in every supported format.</p>
            )}
          </>
        )}
      </Card>

      {current && (
        <div className="mt-8 space-y-4">
          {current.pieces.map((piece) => (
            <Card key={piece.platform}>
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium text-mist-100">
                  <PlatformIcon platform={piece.platform} size={14} />
                  {PLATFORMS.find((p) => p.id === piece.platform)?.label}
                </span>
                <button
                  onClick={() => copy(piece.platform, piece.content)}
                  className="flex items-center gap-1.5 text-xs font-medium text-mist-300 hover:text-mist-50"
                >
                  {copiedKey === piece.platform ? <Check size={13} className="text-signal-orange" /> : <Copy size={13} />}
                  {copiedKey === piece.platform ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="whitespace-pre-wrap font-body text-sm leading-relaxed text-mist-100">{piece.content}</pre>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
