import type { Page } from '@repo/shared'

/**
 * Kontrakt adaptera treści.
 *
 * Etap 1 spełnia go `fixtures.ts`, etap 2 — `payload.ts`. Strony Astro znają
 * wyłącznie ten interfejs, więc przełączenie źródła nie dotyka ani jednego
 * komponentu (AGENT-RULES §2, cel etapu).
 */
export interface ContentSourceAdapter {
  readonly name: 'fixtures' | 'payload'
  /** Wszystkie opublikowane strony — używane przez `getStaticPaths`. */
  getAllPages(): Promise<Page[]>
  /** Pojedyncza strona albo `null`, gdy nie istnieje. */
  getPage(slug: string): Promise<Page | null>
}
