import { ContentItem } from '../types'

const KEY = 'studio.content.v1'

export function loadContent(): ContentItem[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as ContentItem[]) : []
  } catch {
    return []
  }
}

export function saveContent(items: ContentItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items))
  } catch {
    // storage unavailable — fail silently, app still works in-memory
  }
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}
