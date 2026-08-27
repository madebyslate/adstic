import type { MediaImage } from '@repo/shared'

/**
 * Most między `MediaImage` z kontraktu a `astro:assets`.
 *
 * Obraz przychodzi z dwóch światów i komponent nie ma o tym wiedzieć:
 *   – etap 1 (fixtures): ścieżka `content/media/<plik>` → lokalny plik, który
 *     Astro optymalizuje przy buildzie (AVIF/WebP, warianty `widths`),
 *   – etap 2 (Payload):  absolutny URL `https://<DOMAIN>/api/media/file/<plik>`.
 *
 * Prywatny adres kontenera nigdy nie może trafić do HTML (standard xCloud §6.1),
 * dlatego adapter Payloada przepisuje URL-e na publiczny origin ZANIM dane
 * dojdą tutaj — ta warstwa widzi już wyłącznie publiczne adresy.
 */

/** Lokalne obrazy treściowe. Glob jest rozwijany przy buildzie, nie w runtime. */
const localImages = import.meta.glob<{ default: ImageMetadata }>(
  '../../../../content/media/**/*.{png,jpg,jpeg,webp,avif,gif}',
  { eager: true },
)

/** Klucz w mapie globa to ścieżka względna — sprowadzamy ją do `content/...`. */
const byContentPath = new Map<string, ImageMetadata>(
  Object.entries(localImages).map(([key, mod]) => [
    key.slice(key.indexOf('content/')),
    mod.default,
  ]),
)

export type ResolvedImage = ImageMetadata | string

/**
 * Zwraca to, co `<Image>`/`<Picture>` przyjmuje jako `src`.
 * Rzuca przy brakującym pliku lokalnym — cichy fallback ukryłby błąd fixture
 * dopiero na produkcji.
 */
export function resolveImage(image: MediaImage): ResolvedImage {
  if (/^https?:\/\//.test(image.src)) return image.src

  const asset = byContentPath.get(image.src.replace(/^\/+/, ''))
  if (!asset) {
    throw new Error(
      `Brak pliku obrazu "${image.src}". Fixture wskazuje na plik, którego nie ma w content/media/.`,
    )
  }
  return asset
}

/** Czy `<Image>` musi dostać jawne `width`/`height` (obraz zdalny). */
export function isRemote(src: ResolvedImage): src is string {
  return typeof src === 'string'
}

/**
 * Wektory treściowe (loga klientów).
 *
 * Nie idą przez `astro:assets`: SVG nie ma czego optymalizować, a `<Image>`
 * dla zdalnych URL-i wymaga wymiarów i listy dozwolonych domen — czyli kosztu
 * bez zysku. Glob z `?url` daje ścieżkę do pliku po buildzie (z hashem), więc
 * plik jest cache'owany na stałe tak samo jak reszta assetów.
 */
const localVectors = import.meta.glob<string>('../../../../content/media/**/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
})

const vectorsByContentPath = new Map<string, string>(
  Object.entries(localVectors).map(([key, url]) => [key.slice(key.indexOf('content/')), url]),
)

/**
 * Zwraca URL wektora do wstawienia w `<img src>`.
 * Rzuca przy brakującym pliku — z tego samego powodu co `resolveImage()`.
 */
export function resolveVector(image: MediaImage): string {
  if (/^https?:\/\//.test(image.src)) return image.src

  const url = vectorsByContentPath.get(image.src.replace(/^\/+/, ''))
  if (!url) {
    throw new Error(
      `Brak pliku wektora "${image.src}". Fixture wskazuje na plik, którego nie ma w content/media/.`,
    )
  }
  return url
}
