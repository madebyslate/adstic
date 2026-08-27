import { z } from "zod";

/**
 * FAQ — etykieta, nagłówek i akapit po lewej, rozwijana lista pytań po prawej.
 *
 * Spec wizualny: apps/web/src/components/blocks/Faq.spec.md
 */

/** Jedno pytanie z odpowiedzią. Kolejność w liście = kolejność na stronie. */
export const FaqItem = z.object({
  question: z.string().min(1),
  /**
   * Zwykły tekst, nie `RichText`: w makiecie odpowiedź to jeden akapit bez
   * linków i wyróżnień. Podmiana na `RichText` (i `set:html` w komponencie) to
   * jedna linijka po obu stronach — nie ma powodu płacić dziś za formatowanie,
   * którego nie ma, ryzykiem HTML-a wstrzykniętego z fixture'a.
   */
  answer: z.string().min(1),
});
export type FaqItem = z.infer<typeof FaqItem>;

export const FaqBlock = z.object({
  blockType: z.literal("faq"),
  /** Etykieta nad nagłówkiem. Wersaliki robi CSS — dane niosą tekst, nie krój. */
  eyebrow: z.string().min(1),
  /** `<h2>` sekcji. */
  heading: z.string().min(1),
  /** Akapit pod nagłówkiem, w lewej kolumnie. */
  description: z.string().min(1),
  items: z.array(FaqItem).min(1),
});
export type FaqBlock = z.infer<typeof FaqBlock>;
