import { PUBLIC_SITE_URL } from 'astro:env/client'

/**
 * Publiczny origin. Jedyne miejsce, w którym powstają absolutne URL-e
 * (canonical, OG, sitemapa). Zmiana `PUBLIC_SITE_URL` wymaga ponownego
 * statycznego buildu, bo origin jest wpisany w HTML (standard xCloud §14).
 */
export const siteOrigin = new URL(PUBLIC_SITE_URL).origin

/** Ścieżka względna → absolutny URL na publicznej domenie. */
export function absoluteUrl(path: string): string {
  return new URL(path, `${siteOrigin}/`).href
}
