import { z } from "zod";
import { Link, MediaImage } from "../primitives";

/**
 * Cta — „Let's talk”: płyta z łuną w tle, nagłówek, przycisk i trzy korzyści.
 *
 * Spec wizualny: apps/web/src/components/blocks/Cta.spec.md
 */
export const CtaBlock = z.object({
  blockType: z.literal("cta"),
  /** Etykieta nad nagłówkiem; nagłówkiem sekcji jest `heading`, nie ona. */
  eyebrow: z.string().min(1),
  heading: z.string().min(1),
  cta: Link,
  /**
   * Pytanie nad plakietkami. Nie jest nagłówkiem dokumentu (`<p>`, nie `<h3>`) —
   * to podpis listy, którą wprowadza; nagłówkiem sekcji zostaje `heading`.
   */
  benefitsHeading: z.string().min(1),
  /**
   * Korzyści jako gołe zdania, nie obiekty: ikona „check” jest ta sama we
   * wszystkich plakietkach, więc nie ma czego trzymać w danych. W złożeniu są
   * trzy i przy czterech wiersz łamie się na wąskim desktopie — stąd górna
   * granica, nie sztywna długość jak w `HowWeWork` (tam liczbę mówi nagłówek).
   */
  benefits: z.array(z.string().min(1)).min(1).max(4),
  /** Kadr z czerwoną łuną pod treścią płyty. `alt` puste — czysta dekoracja. */
  background: MediaImage,
});
export type CtaBlock = z.infer<typeof CtaBlock>;
