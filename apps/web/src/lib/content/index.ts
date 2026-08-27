import { CONTENT_SOURCE } from 'astro:env/server'
import { fixturesAdapter } from './fixtures'
import type { ContentSourceAdapter } from './types'

export type { ContentSourceAdapter } from './types'

/**
 * Jedyne wejście do treści dla stron i komponentów.
 *
 *   CONTENT_SOURCE=fixtures → content/pages/*.json          (etap 1)
 *   CONTENT_SOURCE=payload  → Payload REST API przy buildzie (etap 2)
 *
 * Adapter Payloada ładujemy dynamicznie, żeby etap 1 nie ciągnął do grafu modułu
 * kodu sięgającego po sekrety — a przy okazji build bez CMS-a nie musi znać
 * PAYLOAD_API_URL.
 */
async function loadAdapter(): Promise<ContentSourceAdapter> {
  if (CONTENT_SOURCE === 'payload') {
    const { payloadAdapter } = await import('./payload')
    return payloadAdapter
  }
  return fixturesAdapter
}

const adapter = await loadAdapter()

export const contentSource = adapter.name

export function getAllPages() {
  return adapter.getAllPages()
}

export function getPage(slug: string) {
  return adapter.getPage(slug)
}
