import { z } from 'zod'
import { MediaImage } from '../primitives'

/**
 * Pojedyncza opinia klienta.
 *
 * `author` jest płaskim stringiem, nie grupą jak w `TrustedBy.testimonial` —
 * w tej sekcji pod opinią stoi WYŁĄCZNIE imię i nazwisko. Gdyby pole było
 * grupą z opcjonalną rolą, redaktor mógłby ją wypełnić i nigdzie by się nie
 * pokazała; kształt danych ma odpowiadać temu, co blok renderuje.
 */
export const CustomerReview = z.object({
  /** Treść opinii. Cudzysłowy dokłada CSS, nie dane. */
  quote: z.string().min(1),
  /** Podpis pod opinią — imię i nazwisko. */
  author: z.string().min(1),
  /**
   * Ocena w gwiazdkach. Makieta ma wszędzie 5, ale pole jest w danych, a nie
   * na sztywno w komponencie: pierwsza opinia z czterema gwiazdkami nie może
   * wymagać zmiany kodu.
   */
  rating: z.number().int().min(1).max(5).default(5),
  /**
   * Logotyp firmy klienta w prawym górnym rogu boxa. Opcjonalny — nie każda
   * osoba wystawiająca opinię reprezentuje markę z logotypem.
   * `alt` puste: nazwa marki nie niesie tu treści, autor jest w podpisie.
   */
  logo: MediaImage.optional(),
})
export type CustomerReview = z.infer<typeof CustomerReview>

/**
 * CustomerReviews — ściana opinii: wyśrodkowana szapka i pod nią trzy kolumny
 * boxów jadące pionowo (skrajne w górę, środkowa w dół) na wtopionym w tło
 * kadrze.
 *
 * Spec wizualny: apps/web/src/components/blocks/CustomerReviews.spec.md
 */
export const CustomerReviewsBlock = z.object({
  blockType: z.literal('customerReviews'),
  /** Etykieta nad nagłówkiem. Wersaliki robi CSS — dane niosą tekst, nie krój. */
  eyebrow: z.string().min(1),
  /** `<h2>` sekcji. Łamanie na dwa wiersze wychodzi z szerokości, nie z danych. */
  heading: z.string().min(1),
  /** Zdanie pod nagłówkiem. */
  description: z.string().min(1),
  /**
   * Kadr pod ścianą opinii. Osobne pole, a nie tło w CSS — to plik
   * podmienialny przez redaktora, tak samo jak łuna w `OurImpact`.
   * `alt` puste: dekoracja.
   */
  background: MediaImage,
  /**
   * Opinie. Minimum trzy, bo tyle jest kolumn — przy dwóch trzecia zostałaby
   * pusta i pas rozjechałby się wizualnie.
   */
  reviews: z.array(CustomerReview).min(3),
})
export type CustomerReviewsBlock = z.infer<typeof CustomerReviewsBlock>
