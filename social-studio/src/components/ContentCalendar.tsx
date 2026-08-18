import { useMemo, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import Card from './ui/Card'
import Button from './ui/Button'
import PlatformIcon from './PlatformIcon'
import { ContentItem } from '../types'

export default function ContentCalendar({
  items,
  onSchedule
}: {
  items: ContentItem[]
  onSchedule: (id: string, date: string) => void
}) {
  const [pendingId, setPendingId] = useState<string>('')
  const [pendingDate, setPendingDate] = useState<string>('')

  const grouped = useMemo(() => {
    const map = new Map<string, ContentItem[]>()
    items
      .filter((i) => i.scheduledFor)
      .forEach((i) => {
        const key = i.scheduledFor as string
        map.set(key, [...(map.get(key) ?? []), i])
      })
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [items])

  const unscheduled = items.filter((i) => !i.scheduledFor)

  const handleAdd = () => {
    if (!pendingId || !pendingDate) return
    onSchedule(pendingId, pendingDate)
    setPendingId('')
    setPendingDate('')
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-signal-orange">Content calendar</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-mist-50 sm:text-3xl">Plan when it goes out</h1>
        <p className="mt-2 max-w-xl text-sm text-mist-400">Schedule pieces you've already created against a date.</p>
      </header>

      {items.length === 0 ? (
        <Card className="text-center text-sm text-mist-400">
          Create some content first, then come back to build out your calendar.
        </Card>
      ) : (
        <>
          <Card className="mb-8">
            <p className="mb-3 text-sm font-semibold text-mist-100">Schedule a piece</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                value={pendingId}
                onChange={(e) => setPendingId(e.target.value)}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-mist-50 focus:border-signal-orange/50"
              >
                <option value="" className="bg-ink-900">Choose content…</option>
                {unscheduled.map((i) => (
                  <option key={i.id} value={i.id} className="bg-ink-900">{i.topic}</option>
                ))}
              </select>
              <input
                type="date"
                value={pendingDate}
                onChange={(e) => setPendingDate(e.target.value)}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-mist-50 focus:border-signal-orange/50"
              />
              <Button intent="action" onClick={handleAdd} disabled={!pendingId || !pendingDate}>
                <CalendarDays size={14} />
                Add to calendar
              </Button>
            </div>
          </Card>

          {grouped.length === 0 ? (
            <p className="text-sm text-mist-400">Nothing scheduled yet.</p>
          ) : (
            <div className="space-y-5">
              {grouped.map(([date, entries]) => (
                <div key={date}>
                  <p className="mb-2 font-display text-sm font-semibold text-mist-100">
                    {new Date(date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                  </p>
                  <div className="space-y-2">
                    {entries.map((i) => (
                      <Card key={i.id} className="flex items-center justify-between">
                        <span className="text-sm text-mist-100">{i.topic}</span>
                        <div className="flex gap-1">
                          {i.pieces.map((p) => (
                            <span key={p.platform} className="rounded-md bg-white/5 p-1.5 text-mist-300">
                              <PlatformIcon platform={p.platform} size={12} />
                            </span>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
