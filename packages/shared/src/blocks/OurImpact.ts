import { z } from 'zod'
import { MediaImage } from '../primitives'

/**
 * OurImpact — dowód działania: etykieta, jedno zdanie nagłówka i zrzut panelu
 * Adstic pod nim, na czerwonej łunie wtopionej w tło strony.
 *
 * Spec wizualny: apps/web/src/components/blocks/OurImpact.spec.md
 */
export const OurImpactBlock = z.object({
  blockType: z.literal('ourImpact'),
  /** Etykieta nad nagłówkiem. Wersaliki robi CSS — dane niosą tekst, nie krój. */
  eyebrow: z.string().min(1),
  /** `<h2>` sekcji. Łamanie na dwa wiersze wychodzi z szerokości, nie z danych. */
  heading: z.string().min(1),
  /**
   * Łuna za nagłówkiem. Osobne pole, a nie tło w CSS: to plik podmienialny
   * przez redaktora tak samo jak tło hero. `alt` puste — dekoracja.
   */
  glow: MediaImage,
  /** Wektorowy panel. Niesie treść, więc `alt` opisuje, co na nim widać. */
  dashboard: MediaImage,
})
export type OurImpactBlock = z.infer<typeof OurImpactBlock>
