import { z } from "zod";

/**
 * Pojedynczy krok współpracy.
 *
 * Numer (`/01`) nie jest polem: to ozdobnik z makiety, liczony z pozycji na
 * liście — tak samo jak ukośnik przed rolą autora w `TrustedBy`. Gdyby numer
 * był danymi, zmiana kolejności kroków rozjeżdżałaby numerację.
 */
export const WorkStep = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
});
export type WorkStep = z.infer<typeof WorkStep>;

/**
 * HowWeWork — cztery kroki współpracy w jednym pasie.
 *
 * Spec wizualny: apps/web/src/components/blocks/HowWeWork.spec.md
 */
export const HowWeWorkBlock = z.object({
  blockType: z.literal("howWeWork"),
  /** Etykieta nad nagłówkiem; nagłówkiem sekcji jest `heading`, nie ona. */
  eyebrow: z.string().min(1),
  heading: z.string().min(1),
  /** Zdanie pod nagłówkiem — wprowadzenie, nie podtytuł. */
  lead: z.string().min(1),
  /**
   * Dokładnie cztery kroki, w kolejności czytania. Liczba jest sztywna, bo
   * mówi o niej sam nagłówek („Four steps”) — trzy kroki i to zdanie to
   * sprzeczność w treści, nie wariant układu. Sam CSS jest na to obojętny:
   * promienie idą po `:first-child` / `:last-child`, więc zmiana tej liczby
   * jest zmianą TU i w nagłówku, nie w komponencie.
   */
  steps: z.array(WorkStep).length(4),
});
export type HowWeWorkBlock = z.infer<typeof HowWeWorkBlock>;
