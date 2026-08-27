import type { APIRoute } from 'astro'
import { siteOrigin } from '@/lib/site'

/**
 * `robots.txt` generowany przy buildzie.
 *
 * Statyczny plik w `public/` nie zadziała: dyrektywa `Sitemap` wymaga
 * ABSOLUTNEGO URL-a, a publiczny origin jest znany dopiero z PUBLIC_SITE_URL.
 */
export const GET: APIRoute = () =>
  new Response(
    `User-agent: *\nAllow: /\n\nSitemap: ${siteOrigin}/sitemap-index.xml\n`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  )
