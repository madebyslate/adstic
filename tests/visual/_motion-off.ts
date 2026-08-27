import { test as base } from '@playwright/test'

/**
 * `test` dla wszystkiego, co mierzy UŁOŻENIE albo robi snapshot.
 *
 * Strona ma choreografię wejścia (patrz „Wejścia" w global.css): sekcja
 * poniżej zgięcia trzyma klatkę startową, aż obserwator ją zwolni, a elementy
 * dojeżdżają na miejsce przez 0,9 s. Test, który zmierzy `boundingBox()` albo
 * zrobi zrzut w trakcie, dostanie pozycję przejściową — raz tę, raz inną.
 *
 * `emulateMedia({ reducedMotion: 'reduce' })` przed każdym `goto` ustawia stan
 * SPOCZYNKOWY: reguła globalna skraca każdą animację do 0,01 ms i wymusza
 * `animation-play-state: running`, więc wszystko ląduje na klatce końcowej,
 * zanim test cokolwiek zmierzy. Marquee i orbita też stają, co przy okazji
 * usuwa z porównań jedyne pozostałe źródło niedeterminizmu.
 *
 * NIE używa tego `motion.spec.ts` — tam pytanie brzmi „czy ruch w ogóle jest",
 * więc musi patrzeć na stronę z ruchem włączonym.
 *
 * PUŁAPKA: `test.use({ reducedMotion: 'reduce' })` w tej wersji Playwrighta
 * nie dociera do przeglądarki — `matchMedia` w stronie zwraca `false`, a test
 * przechodzi, nie sprawdzając niczego. Stąd fixture na `page`, nie opcja.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })

    /*
     * Drugie źródło niedeterminizmu, po ruchu: zasoby. `toHaveScreenshot`
     * ponawia zrzut, aż dwa kolejne będą identyczne, ale to nie pomaga, gdy font
     * podmienia się raz i zostaje — porównanie łapie wtedy stabilny, ale ZŁY
     * stan. Objawia się to widmem tekstu na całym bloku i sypie się losowo,
     * zależnie od tego, czy przebieg trafił w rozgrzany cache.
     *
     * Stąd `goto`, które czeka na fonty i na obrazy.
     *
     * PUŁAPKA: `loading="lazy"` poza kadrem ma `complete === false` i NIGDY nie
     * wyemituje `load` — czekanie na wszystkie `document.images` wiesza każdy
     * test do timeoutu. Dlatego filtr po `loading` i tak wyścig z zegarem:
     * czekanie na zasoby ma test przyspieszyć, a nie dać mu nowy sposób na
     * zawieszenie się.
     */
    const navigate = page.goto.bind(page)
    page.goto = async (url, options) => {
      const response = await navigate(url, options)

      await page.evaluate(() =>
        Promise.race([
          Promise.all([
            document.fonts.ready,
            ...[...document.images]
              .filter((image) => !image.complete && image.loading !== 'lazy')
              .map(
                (image) =>
                  new Promise((done) => {
                    image.addEventListener('load', done, { once: true })
                    image.addEventListener('error', done, { once: true })
                  }),
              ),
          ]),
          new Promise((done) => setTimeout(done, 3000)),
        ]),
      )

      return response
    }

    await use(page)
  },
})

export { expect } from '@playwright/test'
