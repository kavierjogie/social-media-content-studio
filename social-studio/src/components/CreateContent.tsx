import { useState, useEffect } from 'react'
import { Sparkles, Copy, Check, ChevronDown, Repeat, BookOpen, AlertTriangle } from 'lucide-react'
import Card from './ui/Card'
import Button from './ui/Button'
import PlatformIcon from './PlatformIcon'
import { PLATFORMS } from '../data/platforms'
import { PROMPTS } from '../data/prompts'
import { Platform, ContentItem, PromptTemplate } from '../types'
import { transformContent } from '../lib/generator'
import { uid } from '../lib/storage'
import RefinePiece from './RefinePiece'

const TONES = [
  { id: 'default', label: 'Natural' },
  { id: 'bold', label: 'Bold' },
  { id: 'playful', label: 'Playful' },
  { id: 'formal', label: 'Formal' }
]

export default function CreateContent({
  onSave,
  onUpdate,
  prefillPrompt,
  onClearPrompt,
  goToTransform
}: {
  onSave: (item: ContentItem) => void
  onUpdate?: (item: ContentItem) => void
  prefillPrompt?: PromptTemplate
  onClearPrompt?: () => void
  goToTransform: (item: ContentItem) => void
}) {
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(prefillPrompt ?? null)
  const [topic, setTopic] = useState('')
  const [tone, setTone] = useState('default')
  const [selected, setSelected] = useState<Platform[]>(['linkedin', 'instagram'])
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [result, setResult] = useState<ContentItem | null>(null)
  const [activeTab, setActiveTab] = useState<Platform | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // API Key State
  const envKeyExists = !!(import.meta.env.VITE_GEMINI_API_KEY && import.meta.env.VITE_GEMINI_API_KEY.trim())
  const [localKey, setLocalKey] = useState(() => localStorage.getItem('studio.gemini_api_key') || '')
  const [showKeySettings, setShowKeySettings] = useState(false)
  const hasApiKey = envKeyExists || !!localKey.trim()

  // Loading & Error States
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (prefillPrompt) {
      setSelectedPrompt(prefillPrompt)
      setTopic('') // reset input to fill the template variable
    }
  }, [prefillPrompt])

  const togglePlatform = (p: Platform) => {
    setSelected((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]))
  }

  const canGenerate = topic.trim().length > 0 && selected.length > 0 && hasApiKey && !generating

  const compiledPrompt = selectedPrompt
    ? selectedPrompt.template.replace('{topic}', topic.trim() || '[topic]')
    : topic.trim()

  const handleGenerate = async () => {
    if (!canGenerate) return
    setGenerating(true)
    setError(null)
    setResult(null)

    try {
      const finalPrompt = selectedPrompt
        ? selectedPrompt.template.replace('{topic}', topic.trim())
        : topic.trim()

      const pieces = await transformContent(finalPrompt, selected, tone)
      
      const item: ContentItem = {
        id: uid(),
        topic: finalPrompt,
        tone,
        createdAt: Date.now(),
        sourcePlatform: selected[0],
        pieces
      }
      
      setResult(item)
      setActiveTab(pieces[0]?.platform ?? null)
      onSave(item)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'An error occurred during content generation.')
    } finally {
      setGenerating(false)
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

      {/* API Key Configuration Dropdown */}
      <div className="mb-6">
        <div className="flex justify-between items-center border border-white/5 bg-white/[0.01] rounded-xl px-4 py-3">
          <button
            type="button"
            onClick={() => setShowKeySettings(!showKeySettings)}
            className="text-xs text-mist-400 hover:text-mist-100 flex items-center gap-1 transition-colors"
          >
            ⚙️ API Key Settings
            <ChevronDown size={12} className={`transition-transform ${showKeySettings ? 'rotate-180' : ''}`} />
          </button>
          {hasApiKey ? (
            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              API key active
            </span>
          ) : (
            <span className="text-xs text-signal-orange font-mono flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-signal-orange"></span>
              API key required
            </span>
          )}
        </div>

        {showKeySettings && (
          <div className="mt-2 p-4 rounded-xl border border-white/10 bg-white/[0.02] animate-rise space-y-3">
            <p className="text-xs text-mist-300 leading-relaxed">
              Define <code className="font-mono text-white bg-white/5 px-1 py-0.5 rounded">VITE_GEMINI_API_KEY</code> in your environment variable / <code className="font-mono text-white bg-white/5 px-1 py-0.5 rounded">.env</code> file, or set browser key below:
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="Enter Gemini API Key..."
                value={localKey}
                onChange={(e) => {
                  setLocalKey(e.target.value)
                  localStorage.setItem('studio.gemini_api_key', e.target.value)
                }}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-mist-50 focus:border-signal-purple/50 focus:outline-none"
              />
              {localKey && (
                <button
                  type="button"
                  onClick={() => {
                    setLocalKey('')
                    localStorage.removeItem('studio.gemini_api_key')
                  }}
                  className="text-xs text-red-400 hover:text-red-300 font-medium px-2"
                >
                  Clear Key
                </button>
              )}
            </div>
            {envKeyExists && (
              <p className="text-[10px] text-emerald-400">✓ Detected VITE_GEMINI_API_KEY in environment.</p>
            )}
          </div>
        )}
      </div>

      {/* Warning banner if API key is missing */}
      {!hasApiKey && (
        <div className="mb-6 rounded-2xl border border-signal-orange/30 bg-signal-orange/10 p-5 animate-rise flex flex-col gap-3">
          <div className="flex items-center gap-2 text-orange-300">
            <AlertTriangle size={18} />
            <h3 className="font-display text-sm font-semibold">Gemini API Key Required</h3>
          </div>
          <p className="text-xs text-mist-300 leading-relaxed">
            Please enter your API Key below to activate AI content generation. The key will be stored securely in your browser's local storage.
          </p>
          <div className="flex gap-2 max-w-md">
            <input
              type="password"
              placeholder="Paste Gemini API Key..."
              value={localKey}
              onChange={(e) => {
                setLocalKey(e.target.value)
                localStorage.setItem('studio.gemini_api_key', e.target.value)
              }}
              className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs text-mist-50 focus:border-signal-orange/50 focus:outline-none"
            />
            {localKey.trim() && (
              <span className="text-xs text-emerald-400 self-center font-medium">✓ Activated</span>
            )}
          </div>
        </div>
      )}

      <Card className="space-y-7">
        {/* Prompt Template Selector */}
        <div>
          <label className="flex items-center gap-2 font-display text-sm font-semibold text-mist-100 mb-2.5">
            <BookOpen size={16} className="text-signal-purple" />
            Prompt Library template
          </label>
          <select
            value={selectedPrompt?.id ?? ''}
            onChange={(e) => {
              const p = PROMPTS.find((x) => x.id === e.target.value) || null
              setSelectedPrompt(p)
              if (!p && onClearPrompt) onClearPrompt()
            }}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-mist-50 focus:border-signal-purple/50"
          >
            <option value="" className="bg-ink-900">Custom idea (No template)</option>
            {PROMPTS.map((p) => (
              <option key={p.id} value={p.id} className="bg-ink-900">
                [{p.category}] {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Template metadata if selected */}
        {selectedPrompt && (
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-2 animate-rise">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-signal-purple">{selectedPrompt.category}</span>
              <button
                onClick={() => {
                  setSelectedPrompt(null)
                  if (onClearPrompt) onClearPrompt()
                }}
                className="text-[11px] text-mist-400 hover:text-mist-100"
              >
                Clear template
              </button>
            </div>
            <h4 className="text-sm font-semibold text-mist-50">{selectedPrompt.name}</h4>
            <p className="text-xs text-mist-400 leading-relaxed">{selectedPrompt.description}</p>
            <div className="text-xs text-mist-300 bg-white/5 p-2 rounded-lg font-mono">
              <span className="text-signal-pink">Template: </span>
              {selectedPrompt.template.split('{topic}')[0]}
              <span className="text-signal-orange font-bold font-sans">{"{topic}"}</span>
              {selectedPrompt.template.split('{topic}')[1]}
            </div>
          </div>
        )}

        {/* Topic Input */}
        <div>
          <label className="flex items-center gap-2 font-display text-sm font-semibold text-mist-100">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-grad-ai text-[11px] text-white">1</span>
            {selectedPrompt ? 'Fill in the topic ({topic}):' : "What's your topic or idea?"}
          </label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={selectedPrompt ? "e.g. why companies must offer a 4-day work week" : "e.g. Why we switched to a 4-day work week"}
            rows={3}
            className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-mist-50 placeholder:text-mist-400/60 focus:border-signal-purple/50"
          />
          {selectedPrompt && (
            <div className="mt-3 rounded-xl border border-white/5 bg-white/[0.01] p-3 text-xs text-mist-400">
              <p className="font-mono text-[9px] uppercase tracking-wider text-signal-purple">Compiled Prompt Preview</p>
              <p className="mt-1 italic">"{compiledPrompt}"</p>
            </div>
          )}
        </div>

        {/* Platforms */}
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

        {/* Advanced Settings */}
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

        {/* Action Button */}
        <div className="flex items-center gap-2 border-t border-white/8 pt-6">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-grad-action text-[11px] text-white">3</span>
          <Button intent="ai" onClick={handleGenerate} disabled={!canGenerate}>
            <Sparkles size={15} />
            {generating ? 'Generating...' : 'Generate content'}
          </Button>
          {!hasApiKey && (
            <span className="text-xs text-signal-orange">Please provide a Gemini API Key to generate</span>
          )}
          {hasApiKey && !canGenerate && !generating && (
            <span className="text-xs text-mist-400">Add a topic and at least one platform</span>
          )}
        </div>
      </Card>

      {/* Loading Overlay */}
      {generating && (
        <div className="mt-6 flex flex-col items-center justify-center p-12 card-surface rounded-2xl animate-rise relative overflow-hidden">
          <div className="absolute inset-0 bg-grad-panel opacity-50 blur-xl"></div>
          <div className="relative flex flex-col items-center z-10">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-signal-purple/30 border-t-signal-purple"></div>
            <p className="mt-4 font-display text-base font-semibold text-mist-50 animate-pulse">Crafting your content...</p>
            <p className="mt-1 text-xs text-mist-400">Gemini is writing platform-optimized pieces</p>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="mt-6 border border-red-500/30 bg-red-500/10 rounded-2xl p-5 text-sm animate-rise flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-red-300 flex items-center gap-1.5">
              ❌ Content Generation Failed
            </h4>
            <button onClick={() => setError(null)} className="text-mist-400 hover:text-mist-100" aria-label="Dismiss error">
              ✕
            </button>
          </div>
          <p className="text-xs text-red-200 leading-relaxed font-mono whitespace-pre-wrap">{error}</p>
          <p className="text-xs text-mist-400">
            Please verify your API key configuration, network connectivity, and that your API key is active.
          </p>
        </div>
      )}

      {/* Results View */}
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
                {PLATFORMS.find((p) => p.id === piece.platform)?.label || piece.platform}
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
                <RefinePiece
                  topic={result.topic}
                  platform={piece.platform}
                  tone={result.tone}
                  content={piece.content}
                  existingPieces={result.pieces}
                  onSuccess={(newContent) => {
                    const updatedPieces = result.pieces.map((p) =>
                      p.platform === piece.platform ? { ...p, content: newContent } : p
                    )
                    const updatedItem = { ...result, pieces: updatedPieces }
                    setResult(updatedItem)
                    if (onUpdate) onUpdate(updatedItem)
                  }}
                />
              </Card>
            ))}
        </div>
      )}
    </div>
  )
}
