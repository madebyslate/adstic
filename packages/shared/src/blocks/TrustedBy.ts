import { z } from 'zod'
import { MediaImage } from '../primitives'

/**
 * Autor opinii. `role` jest osobnym polem, a nie doklejone do `name`, bo
 * makieta składa je z ozdobnym ukośnikiem i innym kryciem — ukośnik należy
 * do wyglądu, nie do treści.
 */
export const Author = z.object({
  name: z.string().min(1),
  /** np. „Founder domupielesze.pl”. */
  role: z.string().min(1).optional(),
})
export type Author = z.infer<typeof Author>

export const Testimonial = z.object({
  /** Bez cudzysłowów — typograficzne „ ” dokłada komponent. */
  quote: z.string().min(1),
  author: Author,
})
export type Testimonial = z.infer<typeof Testimonial>

/**
 * TrustedBy — opinia klienta obok ściany logotypów marek.
 *
 * Spec wizualny: apps/web/src/components/blocks/TrustedBy.spec.md
 */
export const TrustedByBlock = z.object({
  blockType: z.literal('trustedBy'),
  /** Etykieta badge'a nad blokiem; renderowana jako <h2> sekcji. */
  eyebrow: z.string().min(1),
  testimonial: Testimonial,
  /**
   * Logotypy klientów, w kolejności wyświetlania. Pierwsza połowa listy jedzie
   * górnym pasem, druga dolnym. Wymagany co najmniej jeden — blok bez ściany
   * logotypów nie ma o czym mówić, więc pusta lista to błąd danych, nie wariant.
   */
  logos: z.array(MediaImage).min(1),
})
export type TrustedByBlock = z.infer<typeof TrustedByBlock>
