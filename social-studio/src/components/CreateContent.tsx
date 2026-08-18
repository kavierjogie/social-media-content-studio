import { useState } from 'react'
import { Sparkles, Copy, Check, ChevronDown, Repeat } from 'lucide-react'
import Card from './ui/Card'
import Button from './ui/Button'
import PlatformIcon from './PlatformIcon'
import { PLATFORMS } from '../data/platforms'
import { Platform, ContentItem } from '../types'
import { transformContent } from '../lib/generator'
import { uid } from '../lib/storage'

const TONES = [
  { id: 'default', label: 'Natural' },
  { id: 'bold', label: 'Bold' },
  { id: 'playful', label: 'Playful' },
  { id: 'formal', label: 'Formal' }
]

export default function CreateContent({
  onSave,
  prefillTopic,
  goToTransform
}: {
  onSave: (item: ContentItem) => void
  prefillTopic?: string
  goToTransform: (item: ContentItem) => void
}) {
  const [topic, setTopic] = useState(prefillTopic ?? '')
  const [tone, setTone] = useState('default')
  const [selected, setSelected] = useState<Platform[]>(['linkedin', 'instagram'])
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [result, setResult] = useState<ContentItem | null>(null)
  const [activeTab, setActiveTab] = useState<Platform | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const togglePlatform = (p: Platform) => {
    setSelected((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]))
  }

  const canGenerate = topic.trim().length > 0 && selected.length > 0

  const handleGenerate = () => {
    if (!canGenerate) return
    const pieces = transformContent(topic.trim(), selected, tone)
    const item: ContentItem = {
      id: uid(),
      topic: topic.trim(),
      tone,
      createdAt: Date.now(),
      sourcePlatform: selected[0],
      pieces
    }
    setResult(item)
    setActiveTab(pieces[0]?.platform ?? null)
    onSave(item)
  }

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 1500)
    } catch {
      // clipboard unavailable — silently ignore
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-signal-purple">Create content</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-mist-50 sm:text-3xl">
          Turn one idea into platform-ready content
        </h1>
        <p className="mt-2 max-w-xl text-sm text-mist-400">
          Describe what you want to create, choose where it's going, and generate every version at once.
        </p>
      </header>

      <Card className="space-y-7">
        <div>
          <label className="flex items-center gap-2 font-display text-sm font-semibold text-mist-100">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-grad-ai text-[11px] text-white">1</span>
            What's your topic or idea?
          </label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Why we switched to a 4-day work week"
            rows={3}
            className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-mist-50 placeholder:text-mist-400/60 focus:border-signal-purple/50"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 font-display text-sm font-semibold text-mist-100">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-grad-social text-[11px] text-white">2</span>
            Which platforms?
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            {PLATFORMS.map((p) => {
              const active = selected.includes(p.id)
              return (
                <button
                  key={p.id}
                  onClick={() => togglePlatform(p.id)}
                  className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition-colors ${
                    active
                      ? 'border-signal-pink/40 bg-signal-pink/15 text-pink-200'
                      : 'border-white/10 bg-white/[0.03] text-mist-400 hover:text-mist-100'
                  }`}
                >
                  <PlatformIcon platform={p.id} size={14} />
                  {p.label}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <button
            onClick={() => setAdvancedOpen((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-mist-400 hover:text-mist-100"
          >
            Advanced settings
            <ChevronDown size={14} className={`transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
          </button>
          {advancedOpen && (
            <div className="mt-4 animate-rise rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <p className="mb-2.5 text-xs font-medium text-mist-300">Tone of voice</p>
              <div className="flex flex-wrap gap-2">
                {TONES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTone(t.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                      tone === t.id
                        ? 'border-signal-orange/40 bg-signal-orange/15 text-orange-200'
                        : 'border-white/10 text-mist-400 hover:text-mist-100'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-white/8 pt-6">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-grad-action text-[11px] text-white">3</span>
          <Button intent="ai" onClick={handleGenerate} disabled={!canGenerate}>
            <Sparkles size={15} />
            Generate content
          </Button>
          {!canGenerate && (
            <span className="text-xs text-mist-400">Add a topic and at least one platform</span>
          )}
        </div>
      </Card>

      {result && (
        <div className="mt-8 animate-rise">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-mist-50">Ready to publish</h2>
            <Button intent="action" onClick={() => goToTransform(result)}>
              <Repeat size={14} />
              Transform into other formats
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 border-b border-white/8 pb-3">
            {result.pieces.map((piece) => (
              <button
                key={piece.platform}
                onClick={() => setActiveTab(piece.platform)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === piece.platform
                    ? 'bg-white/10 text-mist-50'
                    : 'text-mist-400 hover:text-mist-100'
                }`}
              >
                <PlatformIcon platform={piece.platform} size={13} />
                {PLATFORMS.find((p) => p.id === piece.platform)?.label}
              </button>
            ))}
          </div>

          {result.pieces
            .filter((piece) => piece.platform === activeTab)
            .map((piece) => (
              <Card key={piece.platform} className="mt-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-mono text-xs text-mist-400">
                    {piece.content.length} characters
                  </span>
                  <button
                    onClick={() => copy(piece.platform, piece.content)}
                    className="flex items-center gap-1.5 text-xs font-medium text-mist-300 hover:text-mist-50"
                  >
                    {copiedKey === piece.platform ? <Check size={13} className="text-signal-orange" /> : <Copy size={13} />}
                    {copiedKey === piece.platform ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre className="whitespace-pre-wrap font-body text-sm leading-relaxed text-mist-100">
                  {piece.content}
                </pre>
              </Card>
            ))}
        </div>
      )}
    </div>
  )
}
