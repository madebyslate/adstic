import { z } from "zod";
import { Link, MediaImage } from "../primitives";

/**
 * WhyChooseUs — powód wyboru agencji: tekst z przyciskiem po lewej, cztery
 * argumenty z ikonami po prawej, całość przecięta kreskami jak tabela.
 *
 * Spec wizualny: apps/web/src/components/blocks/WhyChooseUs.spec.md
 */

/** Jeden argument. Kolejność w tablicy = kolejność na stronie. */
export const WhyChooseUsItem = z.object({
  /**
   * Ikona kropkowa (SVG). To POLE DANYCH, a nie ozdobnik liczony z pozycji
   * (inaczej niż kolor kwadratu w AdPlacements): rysunek należy do konkretnego
   * argumentu, więc w etapie 2 redaktor wymienia go razem z tekstem.
   *
   * `width`/`height` niosą naturalne wymiary pliku — CSS i tak renderuje ikonę
   * w stałej szerokości, ale bez nich przeglądarka nie zna proporcji i rezerwuje
   * złą wysokość (AGENT-RULES §5.3).
   */
  icon: MediaImage,
  title: z.string().min(1),
  /** Zwykły tekst: w makiecie nie ma tu ani linku, ani wyróżnienia. */
  description: z.string().min(1),
});
export type WhyChooseUsItem = z.infer<typeof WhyChooseUsItem>;

export const WhyChooseUsBlock = z.object({
  blockType: z.literal("whyChooseUs"),
  /** Etykieta nad nagłówkiem. Wersaliki robi CSS — dane niosą tekst, nie krój. */
  eyebrow: z.string().min(1),
  /** `<h2>` sekcji. */
  heading: z.string().min(1),
  /** Akapit pod nagłówkiem, w lewej kolumnie. */
  description: z.string().min(1),
  /** Przycisk na dole lewej kolumny. */
  cta: Link,
  /**
   * Górna granica jest po to, żeby siatka kresek pozostała czytelna: przy
   * siedmiu argumentach prawa kolumna urasta na tyle, że lewa zostaje z pustym
   * polem na pół ekranu.
   */
  items: z.array(WhyChooseUsItem).min(2).max(6),
});
export type WhyChooseUsBlock = z.infer<typeof WhyChooseUsBlock>;
