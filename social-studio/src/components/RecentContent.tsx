import { useState } from 'react'
import { Trash2, ChevronDown, Repeat } from 'lucide-react'
import Card from './ui/Card'
import PlatformIcon from './PlatformIcon'
import { PLATFORMS } from '../data/platforms'
import { ContentItem } from '../types'

export default function RecentContent({
  items,
  onDelete,
  onTransform
}: {
  items: ContentItem[]
  onDelete: (id: string) => void
  onTransform: (item: ContentItem) => void
}) {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-signal-orange">Recent content</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-mist-50 sm:text-3xl">Everything you've made</h1>
        <p className="mt-2 max-w-xl text-sm text-mist-400">
          Revisit past ideas, copy content again, or transform them into a format you haven't tried yet.
        </p>
      </header>

      {items.length === 0 ? (
        <Card className="text-center text-sm text-mist-400">
          Nothing here yet. Content you create will show up in this list.
        </Card>
      ) : (
        <div className="space-y-3">
          {items
            .slice()
            .sort((a, b) => b.createdAt - a.createdAt)
            .map((item) => {
              const open = openId === item.id
              return (
                <Card key={item.id} className="!p-0 overflow-hidden">
                  <button
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    onClick={() => setOpenId(open ? null : item.id)}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-display text-sm font-medium text-mist-50">{item.topic}</p>
                      <p className="mt-1 text-xs text-mist-400">
                        {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        {'  ·  '}
                        {item.pieces.length} format{item.pieces.length === 1 ? '' : 's'}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <div className="hidden gap-1 sm:flex">
                        {item.pieces.slice(0, 4).map((p) => (
                          <span key={p.platform} className="rounded-md bg-white/5 p-1.5 text-mist-300">
                            <PlatformIcon platform={p.platform} size={12} />
                          </span>
                        ))}
                      </div>
                      <ChevronDown size={16} className={`text-mist-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {open && (
                    <div className="animate-rise border-t border-white/8 px-5 py-4">
                      <div className="space-y-4">
                        {item.pieces.map((p) => (
                          <div key={p.platform}>
                            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-mist-300">
                              <PlatformIcon platform={p.platform} size={12} />
                              {PLATFORMS.find((pl) => pl.id === p.platform)?.label}
                            </p>
                            <pre className="whitespace-pre-wrap font-body text-sm leading-relaxed text-mist-100">{p.content}</pre>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 flex items-center gap-3 border-t border-white/8 pt-4">
                        <button
                          onClick={() => onTransform(item)}
                          className="flex items-center gap-1.5 text-xs font-medium text-signal-orange hover:text-orange-300"
                        >
                          <Repeat size={13} />
                          Transform further
                        </button>
                        <button
                          onClick={() => onDelete(item.id)}
                          className="flex items-center gap-1.5 text-xs font-medium text-mist-400 hover:text-red-400"
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}
        </div>
      )}
    </div>
  )
}
