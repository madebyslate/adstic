import { z } from 'zod'
import { AvatarLink, MediaImage } from '../primitives'

/**
 * Ikona kafla statystyki. Zamknięta lista, nie ścieżka do pliku: rysunek jest
 * elementem makiety, nie treścią — redaktor wybiera ZNACZENIE („doświadczenie",
 * „wzrost", „cena"), a nie grafikę. Dzięki temu podmiana zestawu ikon nie
 * wymaga ruszania treści.
 */
export const StatIcon = z.enum(['award', 'chart', 'tag'])
export type StatIcon = z.infer<typeof StatIcon>

/** Kafel z osobą: zdjęcie i podpis, opcjonalnie plakietka roli. */
export const PersonCard = z.object({
  kind: z.literal('person'),
  photo: MediaImage,
  /** Podpis pod zdjęciem — imię i nazwisko. */
  name: z.string().min(1),
  /** Plakietka na zdjęciu, np. „Owner". Bez wartości plakietki nie ma. */
  badge: z.string().min(1).optional(),
})
export type PersonCard = z.infer<typeof PersonCard>

/** Kafel z liczbą: ikona, wartość i jedno zdanie kontekstu. */
export const StatCard = z.object({
  kind: z.literal('stat'),
  icon: StatIcon,
  /** Tekst, nie liczba — makieta pokazuje „+6 years" i „50%". */
  value: z.string().min(1),
  description: z.string().min(1),
})
export type StatCard = z.infer<typeof StatCard>

export const WhoWeAreCard = z.discriminatedUnion('kind', [PersonCard, StatCard])
export type WhoWeAreCard = z.infer<typeof WhoWeAreCard>

/**
 * CTA bloku ma awatar przy etykiecie — to jest część przycisku, nie ozdoba obok.
 *
 * Ten sam przycisk stoi w `CaseStudies`, więc kształt mieszka w prymitywach
 * (`AvatarLink`). Nazwa lokalna zostaje: to ona opisuje ROLĘ pola w tym bloku
 * i to ona pojawi się w polu Payloada.
 */
export const WhoWeAreCta = AvatarLink
export type WhoWeAreCta = z.infer<typeof WhoWeAreCta>

/**
 * WhoWeAre — kto stoi za agencją: zdanie odsłaniane na scrollu, siatka kafli
 * z ludźmi i liczbami, na dole obietnica i CTA do założycieli.
 *
 * Spec wizualny: apps/web/src/components/blocks/WhoWeAre.spec.md
 */
export const WhoWeAreBlock = z.object({
  blockType: z.literal('whoWeAre'),
  /** Etykieta badge'a nad blokiem; renderowana jako `<h2>` sekcji. */
  eyebrow: z.string().min(1),
  /**
   * Pierwsze zdanie — jedyny fragment czytelny od razu, reszta dochodzi
   * przy przewijaniu. Rozdział na `lead` i `body` jest treściowy (teza
   * i jej rozwinięcie), nie techniczny — animacja korzysta z niego, ale
   * bez JS i bez animacji podział dalej ma sens.
   */
  lead: z.string().min(1),
  body: z.string().min(1),
  /** Akapit przy dolnej krawędzi, nad przyciskiem. */
  note: z.string().min(1),
  cta: WhoWeAreCta,
  /**
   * Dokładnie pięć kafli, w kolejności czytania: osoba, statystyka, osoba,
   * statystyka, statystyka. Układ siatki jest z makiety i przypisuje pozycję
   * po kolejności — dlatego liczba jest sztywna, a nie „min 1". Zmiana układu
   * = zmiana tej liczby TU i reguł w komponencie, nigdy samych danych.
   */
  cards: z.array(WhoWeAreCard).length(5),
})
export type WhoWeAreBlock = z.infer<typeof WhoWeAreBlock>
