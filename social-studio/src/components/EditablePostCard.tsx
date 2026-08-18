import { useState, useRef, useEffect } from 'react'
import { Copy, Check } from 'lucide-react'
import Card from './ui/Card'
import PlatformIcon from './PlatformIcon'
import RefinePiece from './RefinePiece'
import { platformMeta } from '../data/platforms'
import { Platform, GeneratedPiece } from '../types'

interface EditablePostCardProps {
  topic: string
  platform: Platform
  tone: string
  content: string
  existingPieces?: GeneratedPiece[]
  onUpdate: (newContent: string) => void
  showHeaderLabel?: boolean
}

export default function EditablePostCard({
  topic,
  platform,
  tone,
  content,
  existingPieces,
  onUpdate,
  showHeaderLabel = false
}: EditablePostCardProps) {
  const [copied, setCopied] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const meta = platformMeta(platform)
  const limit = meta?.charLimit
  const currentLength = content.length

  let isApproaching = false
  let isExceeded = false
  let statusText = '✓ Within limit'
  let statusColorClass = 'text-emerald-400'
  let barColorClass = 'bg-emerald-500'

  if (limit) {
    isExceeded = currentLength > limit
    isApproaching = !isExceeded && currentLength >= limit * 0.85

    if (isExceeded) {
      statusText = `❌ Limit exceeded by ${currentLength - limit} character${currentLength - limit === 1 ? '' : 's'}`
      statusColorClass = 'text-red-400'
      barColorClass = 'bg-red-500'
    } else if (isApproaching) {
      statusText = `⚠️ Approaching limit (${limit - currentLength} left)`
      statusColorClass = 'text-amber-400'
      barColorClass = 'bg-amber-500'
    } else {
      statusText = '✓ Within limit'
      statusColorClass = 'text-emerald-400'
      // Determine bar color class based on theme/accent color
      if (meta.accent === 'purple') {
        barColorClass = 'bg-signal-purple'
      } else if (meta.accent === 'pink') {
        barColorClass = 'bg-signal-pink'
      } else if (meta.accent === 'orange') {
        barColorClass = 'bg-signal-orange'
      }
    }
  }

  // Adjust height to fit the text content
  const adjustHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }

  useEffect(() => {
    adjustHeight()
    window.addEventListener('resize', adjustHeight)
    return () => window.removeEventListener('resize', adjustHeight)
  }, [content])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <Card className="mt-4 flex flex-col gap-4 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/8 pb-3">
        {showHeaderLabel ? (
          <span className="flex items-center gap-2 text-sm font-medium text-mist-100">
            <PlatformIcon platform={platform} size={14} />
            {meta?.label || platform}
          </span>
        ) : (
          <span className="flex items-center gap-2 text-xs font-mono text-mist-400 uppercase tracking-wider">
            Generated Draft
          </span>
        )}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs font-medium text-mist-300 hover:text-mist-50 transition-colors"
        >
          {copied ? (
            <>
              <Check size={13} className="text-signal-orange" />
              <span className="text-signal-orange">Copied</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Editable Content */}
      <div className="relative group">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onUpdate(e.target.value)}
          placeholder="Edit generated draft..."
          className="w-full bg-transparent border border-transparent hover:border-white/5 focus:border-white/10 rounded-lg p-2 -m-2 resize-none outline-none focus:ring-0 font-body text-sm leading-relaxed text-mist-100 placeholder:text-mist-400/50 hover:bg-white/[0.01] focus:bg-white/[0.02] transition-all"
        />
        <div className="pointer-events-none absolute right-0 bottom-0 opacity-0 group-hover:opacity-40 transition-opacity text-[10px] text-mist-400 font-mono select-none">
          ✍️ Click to edit
        </div>
      </div>

      {/* Character Count & Progress Visuals */}
      <div className="mt-2 border-t border-white/5 pt-3">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <span className="font-mono text-xs text-mist-400">
            {limit ? (
              <>
                <span className={isExceeded ? 'text-red-400 font-semibold' : isApproaching ? 'text-amber-400' : 'text-mist-100'}>
                  {currentLength.toLocaleString()}
                </span>
                <span className="text-mist-400/60"> / {limit.toLocaleString()} characters</span>
              </>
            ) : (
              <span>{currentLength.toLocaleString()} characters</span>
            )}
          </span>
          {limit && (
            <span className={`text-xs font-semibold ${statusColorClass} flex items-center gap-1`}>
              {statusText}
            </span>
          )}
        </div>

        {limit && (
          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden relative">
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out ${barColorClass}`}
              style={{ width: `${(Math.min(currentLength, limit) / limit) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* AI Refinement Tools */}
      <RefinePiece
        topic={topic}
        platform={platform}
        tone={tone}
        content={content}
        existingPieces={existingPieces}
        onSuccess={onUpdate}
      />
    </Card>
  )
}
