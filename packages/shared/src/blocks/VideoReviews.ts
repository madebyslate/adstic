import { z } from 'zod'
import { MediaVideo } from '../primitives'

/**
 * Pojedyncza opinia wideo.
 *
 * Kafel niesie DOKŁADNIE dwie rzeczy: kadr wideo i podpis z imieniem i
 * nazwiskiem — dlatego `author` jest płaskim stringiem, tak samo jak
 * w `CustomerReviews`. Firmy, roli ani cytatu tu nie ma, więc nie ma ich też
 * w schemacie: pole, którego blok nie renderuje, jest zaproszeniem dla
 * redaktora do pisania w próżnię.
 */
export const VideoReview = z.object({
  /**
   * Wideo z opinią. Prymityw `MediaVideo` wymusza poster — i dobrze: to on
   * jest tym, co widać w kafelku, dopóki ktoś nie kliknie play. Sam plik wideo
   * nie startuje sam z siebie (`preload="none"`), więc nie ma go w budżecie
   * wejścia na stronę.
   */
  video: MediaVideo,
  /** Podpis w plakietce przy dolnej krawędzi kadru — imię i nazwisko. */
  author: z.string().min(1),
})
export type VideoReview = z.infer<typeof VideoReview>

/**
 * VideoReviews — wyśrodkowana szapka i pod nią karuzela pionowych kafli
 * z opiniami wideo; na dole kreska postępu z czerwoną flarą i para strzałek.
 *
 * Spec wizualny: apps/web/src/components/blocks/VideoReviews.spec.md
 */
export const VideoReviewsBlock = z.object({
  blockType: z.literal('videoReviews'),
  /** Etykieta nad nagłówkiem. Wersaliki robi CSS — dane niosą tekst, nie krój. */
  eyebrow: z.string().min(1),
  /** `<h2>` sekcji. */
  heading: z.string().min(1),
  /**
   * Etykiety strzałek — dla czytnika ekranu i dla `title`. Są w danych, bo to
   * TEKST, a strona jest jednojęzyczna tylko dzisiaj (patrz `Contact`, gdzie
   * polskie zdania stoją wśród angielskich).
   */
  previousLabel: z.string().min(1),
  nextLabel: z.string().min(1),
  /** Etykieta zamknięcia lightboxa — z tego samego powodu co dwie wyżej. */
  closeLabel: z.string().min(1),
  /**
   * Opinie. Minimum trzy, bo tyle kafli widać naraz na desktopie — przy dwóch
   * trzecia kolumna zostałaby pusta, a karuzela nie miałaby czego przewijać.
   */
  reviews: z.array(VideoReview).min(3),
})
export type VideoReviewsBlock = z.infer<typeof VideoReviewsBlock>
