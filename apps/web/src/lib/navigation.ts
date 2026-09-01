import type { Link } from '@repo/shared'

/**
 * Nawigacja główna i CTA nagłówka.
 *
 * ŚWIADOMY WYJĄTEK od „treść mieszka w content/pages/*.json": nawigacja nie
 * należy do żadnej strony, tylko do layoutu — w etapie 2 będzie globalem
 * Payloada (`Header`), a nie polem strony. Trzymanie jej tu, obok layoutu,
 * zamiast wciskania na siłę do schematu `Page`, nie tworzy długu: typ jest
 * wzięty z kontraktu (`Link` z @repo/shared), więc global w etapie 2 powstanie
 * z tego samego kształtu, a `Header.astro` nie zmieni ani linijki — zmieni się
 * tylko źródło importu.
 *
 * Docelowe strony jeszcze nie istnieją; ścieżki są zgodne z polityką
 * `trailingSlash: 'always'` i zaczną działać, gdy powstaną kolejne bloki.
 */
export const mainNavigation: Link[] = [
  { label: 'Proces', href: '/process/' },
  { label: 'Opinie', href: '/opinions/' },
  { label: 'Realizacje', href: '/case-studies/' },
  { label: 'Blog', href: '/blog/' },
  { label: 'Usługi', href: '/services/' },
  { label: 'Wyniki', href: '/results/' },
]

export const headerCta: Link = { label: 'Kontakt', href: '/contact/' }
