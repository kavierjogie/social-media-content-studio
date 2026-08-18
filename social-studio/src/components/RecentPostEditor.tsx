import { useState, useRef, useEffect } from 'react'
import { Copy, Check, Edit2, Save, X } from 'lucide-react'
import PlatformIcon from './PlatformIcon'
import { PLATFORMS, platformMeta } from '../data/platforms'
import { Platform } from '../types'

interface RecentPostEditorProps {
  platform: Platform
  content: string
  onUpdate: (newContent: string) => void
}

export default function RecentPostEditor({
  platform,
  content,
  onUpdate
}: RecentPostEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(content)
  const [copied, setCopied] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const meta = platformMeta(platform)
  const limit = meta?.charLimit
  const currentLength = editedContent.length

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
    if (isEditing) {
      adjustHeight()
    }
  }, [isEditing, editedContent])

  // Sync state if content prop changes externally
  useEffect(() => {
    setEditedContent(content)
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

  const handleSave = () => {
    onUpdate(editedContent)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedContent(content)
    setIsEditing(false)
  }

  // A helper function to parse simple Markdown formatting (bold, italic, list items, headers)
  const renderMarkdown = (text: string) => {
    if (!text) return <p className="text-mist-400 italic">Empty draft</p>;
    
    return text.split('\n').map((line, idx) => {
      // Headers
      if (line.startsWith('# ')) {
        return <h1 key={idx} className="text-lg font-bold text-mist-50 mt-2 mb-1">{line.slice(2)}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={idx} className="text-base font-bold text-mist-50 mt-2 mb-1">{line.slice(3)}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="text-sm font-bold text-mist-50 mt-2 mb-1">{line.slice(4)}</h3>;
      }
      // Bullet list item
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const itemContent = line.trim().slice(2);
        return (
          <ul key={idx} className="list-disc list-inside ml-2 text-mist-200">
            <li className="leading-relaxed text-sm inline-block">{parseInlineMarkdown(itemContent)}</li>
          </ul>
        );
      }
      // Numbered list item
      const numMatch = line.trim().match(/^(\d+)\.\s+(.*)$/);
      if (numMatch) {
        const [, num, itemContent] = numMatch;
        return (
          <ol key={idx} className="list-decimal list-inside ml-2 text-mist-200">
            <li className="leading-relaxed text-sm inline-block">{parseInlineMarkdown(itemContent)}</li>
          </ol>
        );
      }
      // Paragraph line
      return (
        <p key={idx} className="min-h-[1.25rem] leading-relaxed text-sm text-mist-200 font-body">
          {parseInlineMarkdown(line)}
        </p>
      );
    });
  }

  const parseInlineMarkdown = (text: string) => {
    return text.split(/(\*\*.*?\*\*|\*.*?\*)/g).map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={index} className="italic text-mist-100">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  }

  return (
    <div className="border border-white/5 rounded-xl bg-white/[0.01] hover:bg-white/[0.02] p-4 transition-all duration-200 group">
      {/* Header of the piece card */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-3">
        <span className="flex items-center gap-2 text-xs font-semibold text-mist-200">
          <PlatformIcon platform={platform} size={13} />
          {meta?.label || platform}
        </span>
        <div className="flex items-center gap-3">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 text-[11px] font-medium text-mist-400 hover:text-mist-50 transition-colors"
            >
              <Edit2 size={11} />
              Edit
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] font-medium text-mist-400 hover:text-mist-50 transition-colors"
          >
            {copied ? (
              <>
                <Check size={11} className="text-signal-orange" />
                <span className="text-signal-orange">Copied</span>
              </>
            ) : (
              <>
                <Copy size={11} />
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor / Viewer Body */}
      {isEditing ? (
        <div className="space-y-3">
          <textarea
            ref={textareaRef}
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            placeholder={`Write copy for ${meta?.label || platform}...`}
            className="w-full min-h-[100px] bg-white/[0.02] hover:bg-white/[0.03] border border-white/10 hover:border-white/15 focus:border-signal-purple/50 rounded-xl p-3 resize-none outline-none font-body text-sm leading-relaxed text-mist-100 placeholder:text-mist-400/30 transition-all focus:ring-0"
          />

          {/* Action buttons + character limit status */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {/* Character limit bar */}
            <div className="flex-1 min-w-[200px]">
              <div className="flex justify-between items-center text-[10px] font-mono text-mist-400 mb-1">
                <span>
                  {limit ? (
                    <>
                      <span className={isExceeded ? 'text-red-400 font-semibold' : isApproaching ? 'text-amber-400' : 'text-mist-100'}>
                        {currentLength.toLocaleString()}
                      </span>
                      <span> / {limit.toLocaleString()}</span>
                    </>
                  ) : (
                    <span>{currentLength.toLocaleString()} characters</span>
                  )}
                </span>
                {limit && <span className={statusColorClass}>{statusText}</span>}
              </div>
              {limit && (
                <div className="w-full h-1 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${barColorClass}`}
                    style={{ width: `${(Math.min(currentLength, limit) / limit) * 100}%` }}
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-mist-400 hover:text-mist-200 border border-white/5 hover:border-white/10 bg-white/[0.01] hover:bg-white/[0.02] transition-colors"
              >
                <X size={12} />
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white bg-grad-action hover:shadow-glow transition-all hover:scale-[1.02]"
              >
                <Save size={12} />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div 
          onClick={() => setIsEditing(true)}
          className="cursor-pointer relative overflow-hidden rounded-lg p-2.5 -m-2.5 space-y-1.5 hover:bg-white/[0.01] transition-colors duration-200 select-text"
        >
          {renderMarkdown(content)}
          <div className="pointer-events-none absolute right-2 bottom-2 opacity-0 group-hover:opacity-60 transition-opacity text-[9px] text-mist-400 font-mono flex items-center gap-1 bg-ink-950/80 px-1.5 py-0.5 rounded border border-white/5 select-none">
            ✍️ Click to edit
          </div>
        </div>
      )}
    </div>
  )
}
