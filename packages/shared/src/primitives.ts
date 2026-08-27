import { z } from 'zod'

/**
 * Prymitywy współdzielone (AGENT-RULES §2.3).
 *
 * Definiujesz raz, używasz wszędzie. Nazwy pól są takie, jak będą w Payloadzie —
 * dzięki temu etap 2 nie wymaga zmian w komponentach.
 */

/** Cel linku. Wewnętrzne ścieżki zaczynają się od `/`, zewnętrzne od `http`. */
export const Link = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
  /** Ustaw tylko dla linków wychodzących; komponent dokłada wtedy rel="noopener". */
  external: z.boolean().optional(),
  /** Aria-label, gdy sam `label` nie wystarcza w kontekście (np. „Więcej"). */
  ariaLabel: z.string().optional(),
})
export type Link = z.infer<typeof Link>

/**
 * Obraz treściowy. Zawsze z wymiarami — bez nich nie da się zarezerwować
 * miejsca w layoucie, a CLS wyjeżdża poza budżet (AGENT-RULES §5.3).
 *
 * `src`:
 *   – etap 1 (fixtures): ścieżka względem repo, np. `content/media/hero.jpg`,
 *   – etap 2 (Payload):  absolutny URL publicznego origin, np.
 *     `https://<DOMAIN>/api/media/file/hero.jpg`.
 * Rozróżnienie obsługuje wyłącznie warstwa `apps/web/src/lib/media.ts`.
 */
export const MediaImage = z.object({
  src: z.string().min(1),
  /** Pusty string = obraz dekoracyjny. Nigdy nie wymyślasz treści alt. */
  alt: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  /** Do LQIP/placeholdera, jeśli źródło je dostarcza. */
  blurDataUrl: z.string().optional(),
})
export type MediaImage = z.infer<typeof MediaImage>

/**
 * Link z twarzą przy etykiecie — pigułka „Let's talk with Founders".
 *
 * Prymityw, a nie pole bloku: ten sam przycisk stoi w `WhoWeAre` i w
 * `CaseStudies`, a awatar jest jego CZĘŚCIĄ, nie ozdobą obok. Gdyby żył
 * w schemacie jednego z bloków, drugi importowałby typ z cudzej domeny.
 */
export const AvatarLink = Link.extend({
  /** Zdjęcie w kółku 32 × 32 px przed etykietą. `alt` puste — nazwisko niesie etykieta. */
  avatar: MediaImage,
})
export type AvatarLink = z.infer<typeof AvatarLink>

/** Pojedyncze źródło wideo. Kolejność w tablicy = kolejność preferencji. */
export const VideoSource = z.object({
  src: z.string().min(1),
  /** np. `video/mp4; codecs=av01.0.05M.08`, `video/mp4; codecs=hvc1`, `video/mp4`. */
  type: z.string().min(1),
  /** np. `(max-width: 768px)` dla osobnego pliku mobilnego. */
  media: z.string().optional(),
})
export type VideoSource = z.infer<typeof VideoSource>

/**
 * Wideo. `poster` jest obowiązkowy — to on jest elementem LCP, nie plik wideo
 * (AGENT-RULES §5.1). Brak postera = blok nie przechodzi review.
 */
export const MediaVideo = z.object({
  /** AV1 → H.265 → H.264; osobne źródło mobilne przez `media`. */
  sources: z.array(VideoSource).min(1),
  poster: MediaImage,
  /** Sekundy — pilnujemy limitu 10 s z budżetu perf. */
  duration: z.number().positive().optional(),
  /** Opis dla czytników ekranu, gdy wideo niesie treść. */
  description: z.string().optional(),
})
export type MediaVideo = z.infer<typeof MediaVideo>

/**
 * Tekst formatowany.
 *
 * DECYZJA (patrz DECISIONS.md): na obu etapach RichText to **string
 * bezpiecznego HTML**. W etapie 2 adapter Payloada konwertuje Lexical AST → HTML
 * podczas buildu, więc komponenty nie zmieniają się ani o linijkę.
 */
export const RichText = z.string()
export type RichText = z.infer<typeof RichText>

/** Metadane SEO strony (AGENT-RULES §7). */
export const Seo = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  /** Ścieżka względna, np. `/o-nas/`. Origin dokłada build z PUBLIC_SITE_URL. */
  canonicalPath: z.string().startsWith('/').optional(),
  ogImage: MediaImage.optional(),
  noindex: z.boolean().optional(),
})
export type Seo = z.infer<typeof Seo>
