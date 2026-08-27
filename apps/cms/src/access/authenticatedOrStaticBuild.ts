import type { Access } from 'payload'

/**
 * Odczyt dla zalogowanego użytkownika panelu albo dla prywatnego buildera Astro
 * (standard xCloud §22).
 *
 * `STATIC_BUILD_TOKEN` NIE ma prefiksu `PUBLIC_` i nigdy nie trafia do HTML —
 * używa go wyłącznie kontener `website-build` w prywatnej sieci Dockera.
 * Anonimowe zapytanie do kolekcji dostaje 403.
 *
 * Referer, User-Agent ani nazwa kontenera NIE są mechanizmem uwierzytelniania.
 */
export const authenticatedOrStaticBuild: Access = ({ req }) => {
  if (req.user) return true

  const expected = process.env.STATIC_BUILD_TOKEN
  const received = req.headers.get('x-static-build-token')

  return Boolean(expected && received === expected)
}

/** Zapis wyłącznie dla zalogowanego użytkownika panelu. */
export const authenticated: Access = ({ req }) => Boolean(req.user)
