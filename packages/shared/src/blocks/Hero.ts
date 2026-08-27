import { z } from 'zod'
import { Link, MediaImage, VideoSource } from '../primitives'

/**
 * Ocena w pasku zaufania pod CTA. Skala jest stała (5), więc w danych trzyma
 * się tylko wypełnienie — inaczej redaktor mógłby wpisać „7 z 5".
 */
export const Rating = z.object({
  value: z.number().int().min(0).max(5),
  /** Tekst obok gwiazdek, np. „+6 lat doświadczenia". */
  note: z.string().min(1),
  /** Pełne zdanie dla czytników ekranu — gwiazdki same w sobie nic nie mówią. */
  label: z.string().min(1),
})
export type Rating = z.infer<typeof Rating>

/**
 * Hero — pierwszy ekran strony głównej.
 *
 * Blok referencyjny: pokazuje wzorzec, który powielają pozostałe bloki.
 * Spec wizualny: apps/web/src/components/blocks/Hero.spec.md
 */
export const HeroBlock = z.object({
  blockType: z.literal('hero'),
  /** Jedyny `<h1>` strony. Renderowany z gradientem — patrz spec. */
  heading: z.string().min(1),
  subheading: z.string().optional(),

  /**
   * Tło. Obraz jest OBOWIĄZKOWY i jest elementem LCP — również wtedy, gdy
   * dojdzie wideo, bo wtedy pełni rolę postera. Rozdzielenie na `background`
   * i `backgroundVideo` (zamiast `MediaVideo`, które ma poster w środku) bierze
   * się stąd, że hero ma działać BEZ wideo — a `MediaVideo` wymusiłoby fikcyjne
   * `sources`, żeby przejść walidację.
   */
  background: MediaImage,
  /** AV1 → H.265 → H.264; osobne źródło mobilne przez `media`. Puste = brak wideo. */
  backgroundVideo: z.array(VideoSource).min(1).optional(),

  cta: Link.optional(),

  /** Pasek zaufania pod CTA: loga klientów + ocena. */
  trust: z
    .object({
      /** Loga marek. `alt` musi przyjść od klienta — nigdy go nie wymyślasz. */
      logos: z.array(MediaImage).default([]),
      rating: Rating.optional(),
    })
    .optional(),
})
export type HeroBlock = z.infer<typeof HeroBlock>
