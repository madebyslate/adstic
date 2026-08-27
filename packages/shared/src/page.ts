import { z } from 'zod'
import { Block } from './blocks'
import { Seo } from './primitives'

/**
 * Strona = SEO + uporządkowana lista bloków.
 *
 * Ten sam kształt zwracają oba adaptery treści (fixtures i Payload), więc
 * strony Astro nie wiedzą, skąd pochodzą dane (AGENT-RULES §2).
 */
export const Page = z.object({
  /** Bez wiodącego i końcowego slasha. Strona główna ma slug `home`. */
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/, {
      message: 'slug: małe litery, cyfry i myślniki, segmenty rozdzielone /',
    }),
  seo: Seo,
  blocks: z.array(Block),
})
export type Page = z.infer<typeof Page>

/** Slug strony głównej — mapowany na `/`, nie na `/home/`. */
export const HOME_SLUG = 'home'

/** Ścieżka publiczna strony, zgodna z polityką `trailingSlash: 'always'`. */
export function pagePath(slug: string): string {
  return slug === HOME_SLUG ? '/' : `/${slug}/`
}
