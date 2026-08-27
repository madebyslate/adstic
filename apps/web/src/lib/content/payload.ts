import { Page } from '@repo/shared'
import { PAYLOAD_API_URL, STATIC_BUILD_TOKEN } from 'astro:env/server'
import { siteOrigin } from '../site'
import type { ContentSourceAdapter } from './types'

/**
 * Adapter etapu 2: Payload REST API.
 *
 * Moduł jest WYŁĄCZNIE buildowy. Nie wolno go importować do kodu hydratowanego
 * w przeglądarce — ujawniłoby to `STATIC_BUILD_TOKEN` (standard xCloud §22).
 * Pilnuje tego `astro:env` (`context: 'server'`, `access: 'secret'`): próba
 * użycia po stronie klienta wywala build.
 *
 * Kolekcja `pages` w Payloadzie jest projektowana 1:1 do schematu `Page`
 * z `@repo/shared`, więc tutaj zostaje tylko:
 *   1. pobranie z prywatnego adresu `http://payload:3000/api`,
 *   2. przepisanie względnych URL-i mediów na publiczny origin,
 *   3. walidacja zod — tym samym schematem, co fixtures.
 */

function apiBase(): string {
  if (!PAYLOAD_API_URL) {
    throw new Error(
      'CONTENT_SOURCE=payload wymaga PAYLOAD_API_URL. Compose ustawia je na http://payload:3000/api.',
    )
  }
  return PAYLOAD_API_URL.replace(/\/+$/, '')
}

async function payloadFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBase()}${path}`, {
    headers: STATIC_BUILD_TOKEN ? { 'x-static-build-token': STATIC_BUILD_TOKEN } : undefined,
  })

  if (!response.ok) {
    // Build MUSI paść. Publikacja „pustej" strony jako fallbacku jest zabroniona
    // (standard xCloud §12) — skasowałaby działającą wersję treścią-widmem.
    throw new Error(`Payload request failed: ${response.status} ${response.statusText} (${path})`)
  }

  return response.json() as Promise<T>
}

/**
 * Payload zwraca media jako ścieżki `/api/media/file/<plik>`. W HTML musi
 * znaleźć się publiczny origin — nigdy `payload:3000` ani `localhost`.
 */
function toPublicUrls<T>(value: T): T {
  if (typeof value === 'string') {
    return (value.startsWith('/api/media/') ? `${siteOrigin}${value}` : value) as T
  }
  if (Array.isArray(value)) {
    return value.map(toPublicUrls) as T
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        toPublicUrls(item),
      ]),
    ) as T
  }
  return value
}

function parsePage(doc: unknown, context: string): Page {
  const result = Page.safeParse(toPublicUrls(doc))
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  • ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n')
    throw new Error(`Dokument Payloada ${context} nie pasuje do schematu Page:\n${issues}`)
  }
  return result.data
}

interface PayloadList<T> {
  docs: T[]
  totalDocs: number
  hasNextPage: boolean
}

export const payloadAdapter: ContentSourceAdapter = {
  name: 'payload',

  async getAllPages() {
    const pages: Page[] = []
    let page = 1

    // Paginujemy jawnie — domyślny `limit` Payloada ucina wyniki po 10 i po
    // cichu wyprodukowałby stronę bez części podstron.
    for (;;) {
      const data = await payloadFetch<PayloadList<{ slug?: string }>>(
        `/pages?limit=50&page=${page}&depth=2&draft=false`,
      )
      pages.push(...data.docs.map((doc) => parsePage(doc, `pages[slug=${doc.slug ?? '?'}]`)))
      if (!data.hasNextPage) break
      page += 1
    }

    if (pages.length === 0) {
      throw new Error('Payload nie zwrócił żadnej strony — build zatrzymany, nie publikuję pustki.')
    }

    return pages
  },

  async getPage(slug) {
    const data = await payloadFetch<PayloadList<unknown>>(
      `/pages?where[slug][equals]=${encodeURIComponent(slug)}&limit=1&depth=2&draft=false`,
    )
    const doc = data.docs[0]
    return doc ? parsePage(doc, `pages[slug=${slug}]`) : null
  },
}
