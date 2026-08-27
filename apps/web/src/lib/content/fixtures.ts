import { Page } from '@repo/shared'
import type { ContentSourceAdapter } from './types'

/**
 * Adapter etapu 1: `content/pages/*.json`.
 *
 * Glob jest rozwijany przy buildzie — dodanie pliku wymaga restartu dev serwera,
 * ale za to build nie dotyka dysku w runtime i nie potrzebuje CMS-a.
 */
const files = import.meta.glob<{ default: unknown }>('../../../../../content/pages/*.json', {
  eager: true,
})

/**
 * Walidacja zod przy buildzie (AGENT-RULES §2.4). Rozjazd schematu i fixture ma
 * wywalić build — komunikat wskazuje plik i ścieżkę pola, żeby nie trzeba było
 * zgadywać, który blok się rozjechał.
 */
function parsePages(): Page[] {
  return Object.entries(files).map(([path, mod]) => {
    const result = Page.safeParse(mod.default)
    if (!result.success) {
      const issues = result.error.issues
        .map((issue) => `  • ${issue.path.join('.') || '(root)'}: ${issue.message}`)
        .join('\n')
      throw new Error(`Fixture ${path} nie pasuje do schematu Page:\n${issues}`)
    }
    return result.data
  })
}

const pages = parsePages()

export const fixturesAdapter: ContentSourceAdapter = {
  name: 'fixtures',
  async getAllPages() {
    return pages
  },
  async getPage(slug) {
    return pages.find((page) => page.slug === slug) ?? null
  },
}
