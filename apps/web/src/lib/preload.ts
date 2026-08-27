import { getImage } from 'astro:assets'
import type { Block } from '@repo/shared'
import { resolveImage, isRemote } from './media'

export interface LcpPreload {
  href: string
  type?: string
  imagesrcset?: string
  imagesizes?: string
}

/**
 * Preload elementu LCP.
 *
 * Preloadujemy WYŁĄCZNIE pierwszy blok strony i wyłącznie jego obraz — obraz
 * tła hero, nie plik wideo (AGENT-RULES §5.1). Preload wszystkiego innego zabiera
 * pasmo temu jednemu żądaniu, które decyduje o LCP.
 *
 * Zwraca `null`, gdy pierwszy blok nie ma obrazu nad foldem.
 */
export async function getLcpPreload(blocks: Block[]): Promise<LcpPreload | null> {
  const first = blocks[0]
  if (!first) return null

  const image = first.blockType === 'hero' ? first.background : null
  if (!image) return null

  const src = resolveImage(image)
  if (isRemote(src)) {
    return { href: src }
  }

  const optimized = await getImage({ src, format: 'avif', width: image.width })
  return { href: optimized.src, type: 'image/avif' }
}
