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
  
  // Loading & Error states
  const [transforming, setTransforming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (activeItem) setSelectedId(activeItem.id)
  }, [activeItem])

  const current = items.find((i) => i.id === selectedId) ?? null
  const existingPlatforms = new Set(current?.pieces.map((p) => p.platform) ?? [])
  const available = PLATFORMS.filter((p) => !existingPlatforms.has(p.id))

  const toggle = (p: Platform) => {
    if (transforming) return
    setTargets((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]))
  }

  const handleTransform = async () => {
    if (!current || targets.length === 0 || transforming) return
    setTransforming(true)
    setError(null)

    try {
      // Perform context-aware transformation by passing current.pieces
      const newPieces = await transformContent(current.topic, targets, current.tone, current.pieces)
      const updated: ContentItem = { ...current, pieces: [...current.pieces, ...newPieces] }
      onUpdate(updated)
      setTargets([])
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'An error occurred during content transformation.')
    } finally {
      setTransforming(false)
    }
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
            disabled={transforming}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-mist-50 focus:border-signal-pink/50 disabled:opacity-40 disabled:cursor-not-allowed"
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
                  {PLATFORMS.find((pl) => pl.id === p.platform)?.label || p.platform}
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
                        disabled={transforming}
                        className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
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
                <Button intent="action" className="mt-4" onClick={handleTransform} disabled={targets.length === 0 || transforming}>
                  <Repeat size={14} />
                  {transforming ? 'Transforming...' : 'Transform'}
                </Button>
              </div>
            ) : (
              <p className="text-sm text-mist-400">This piece already exists in every supported format.</p>
            )}
          </>
        )}
      </Card>

      {/* Loading Overlay */}
      {transforming && (
        <div className="mt-6 flex flex-col items-center justify-center p-12 card-surface rounded-2xl animate-rise relative overflow-hidden">
          <div className="absolute inset-0 bg-grad-panel opacity-50 blur-xl"></div>
          <div className="relative flex flex-col items-center z-10">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-signal-pink/30 border-t-signal-pink"></div>
            <p className="mt-4 font-display text-base font-semibold text-mist-50 animate-pulse">Transforming your content...</p>
            <p className="mt-1 text-xs text-mist-400">Gemini is rewriting the topic for new platforms</p>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="mt-6 border border-red-500/30 bg-red-500/10 rounded-2xl p-5 text-sm animate-rise flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-red-300 flex items-center gap-1.5">
              ❌ Content Transformation Failed
            </h4>
            <button onClick={() => setError(null)} className="text-mist-400 hover:text-mist-100" aria-label="Dismiss error">
              ✕
            </button>
          </div>
          <p className="text-xs text-red-200 leading-relaxed font-mono whitespace-pre-wrap">{error}</p>
        </div>
      )}

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
