import type { Link } from '@repo/shared'

/**
 * Treść stopki: zdanie o firmie, linki prawne i profile społecznościowe.
 *
 * Ten sam wyjątek co w `navigation.ts` i z tego samego powodu: stopka nie
 * należy do żadnej strony, tylko do layoutu — w etapie 2 będzie globalem
 * Payloada (`Footer`), a nie polem `Page`. Menu stopki NIE jest tu powtórzone:
 * bierze się z `mainNavigation`, bo w makiecie to dokładnie ta sama lista
 * w tej samej kolejności. Skopiowanie jej tutaj znaczyłoby, że dodanie pozycji
 * w nagłówku cicho rozjeżdża stopkę.
 */

/** Zdanie pod logo. Trzy wiersze w makiecie wynikają z szerokości kolumny. */
export const footerTagline =
  'Pomagamy firmom skutecznie reklamować się w internecie. Specjalizujemy się w kampaniach Google Ads i Meta Ads. Stawiamy na transparentność i mierzalne wyniki.'

/** Czwarta kolumna menu. Osobna lista, bo to nie jest nawigacja produktowa. */
export const legalNavigation: Link[] = [
  { label: 'Polityka prywatności', href: '/privacy-policy/' },
  { label: 'Regulamin', href: '/terms-of-use/' },
]

/**
 * Profile społecznościowe. `label` jest dostępną nazwą linku (ikona nie niesie
 * tekstu), `icon` wskazuje plik w `assets/social/`.
 *
 * OTWARTE: adresy są założeniem — klient nie podał profili. Do potwierdzenia
 * razem z docelowymi ścieżkami podstron z `navigation.ts`.
 */
export type SocialLink = Link & { icon: 'linkedin' | 'facebook' | 'x' | 'instagram' }

export const socialNavigation: SocialLink[] = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/adstic/', external: true, icon: 'linkedin' },
  { label: 'Facebook', href: 'https://www.facebook.com/adstic/', external: true, icon: 'facebook' },
  { label: 'X', href: 'https://x.com/adstic', external: true, icon: 'x' },
  { label: 'Instagram', href: 'https://www.instagram.com/adstic/', external: true, icon: 'instagram' },
]
