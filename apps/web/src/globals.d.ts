/**
 * Rozszerzenia `window` dzielone między wyspami skryptów.
 *
 * Każdy `<script>` w Astro jest osobnym modułem, więc dwa bloki nie widzą
 * swoich zmiennych. `window` jest jedynym wspólnym miejscem, a ten plik trzyma
 * jego kontrakt w jednym punkcie zamiast w rzutowaniach po komponentach.
 */
declare global {
  interface Window {
    /**
     * Przewija stronę deltą kółka pochodzącą spoza okna (dokument w iframe).
     * Definiowane przez `BaseLayout`; kieruje deltę do Lenis, gdy ten działa.
     */
    adsticScrollByWheel?: (deltaX: number, deltaY: number) => void
  }
}

export {}
