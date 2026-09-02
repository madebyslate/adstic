import { z } from 'zod'
import { AvatarLink, MediaImage } from '../primitives'

/**
 * Pozycja wspólna dla obu form wyróżnienia: dokąd prowadzi, co obiecuje
 * i czyje to logo. Różnicę robi wyłącznie OPRAWA (kafel ze zdjęciem vs wiersz
 * listy), nie treść — dlatego jedna baza, a nie dwa niezależne kształty.
 */
const CaseStudyBase = z.object({
  /** Jedno zdanie wyniku, np. „+55% year-on-year in the skydiving industry". */
  title: z.string().min(1),
  href: z.string().min(1),
  external: z.boolean().optional(),
  /**
   * Logo klienta. `alt` puste — nazwa klienta nie jest treścią tego linku,
   * treścią jest wynik w `title`, a logo powtarzałoby ją czytnikowi ekranu.
   */
  logo: MediaImage,
})

/**
 * Case study z dużą miniaturką. Kadr jest tłem kafla, więc niesie klimat,
 * nie informację — stąd `alt` puste i osobne pole od `logo`.
 */
export const FeaturedCaseStudy = CaseStudyBase.extend({
  thumbnail: MediaImage,
  /**
   * Warstwowy SVG z wynikiem i wykresem. Jest osobnym zasobem od zdjęcia,
   * żeby kadr można było wymienić bez ponownego składania grafiki.
   */
  resultGraphic: MediaImage,
})
export type FeaturedCaseStudy = z.infer<typeof FeaturedCaseStudy>

/** Case study w liście pod kaflami: kwadratowe logo, tytuł, strzałka. */
export const ListedCaseStudy = CaseStudyBase
export type ListedCaseStudy = z.infer<typeof ListedCaseStudy>

/**
 * CaseStudies — wyróżnienie realizacji: cztery kafle ze zdjęciami, pod nimi
 * reszta jako lista z samym tytułem.
 *
 * Spec wizualny: apps/web/src/components/blocks/CaseStudies.spec.md
 */
export const CaseStudiesBlock = z.object({
  blockType: z.literal('caseStudies'),
  /** Etykieta nad nagłówkiem. Wersaliki robi CSS — dane niosą tekst, nie krój. */
  eyebrow: z.string().min(1),
  /** `<h2>` sekcji. */
  heading: z.string().min(1),
  /** Akapit pod nagłówkiem, po lewej stronie przycisku. */
  lead: z.string().min(1),
  /** Ta sama pigułka z twarzą założyciela co w `WhoWeAre` (prymityw `AvatarLink`). */
  cta: AvatarLink,
  /**
   * Dokładnie cztery kafle. Siatka 2 × 2 jest z makiety i nie ma wariantu na
   * trzy ani na pięć — piąta realizacja idzie do `more`, nie psuje układu.
   * Zmiana liczby = zmiana TU i reguł siatki w komponencie, nigdy samych danych.
   */
  featured: z.array(FeaturedCaseStudy).length(4),
  /**
   * Reszta realizacji. Może być pusta — wtedy sekcja to same kafle; lista
   * jest rozszerzeniem wyróżnienia, nie jego warunkiem.
   */
  more: z.array(ListedCaseStudy),
})
export type CaseStudiesBlock = z.infer<typeof CaseStudiesBlock>
