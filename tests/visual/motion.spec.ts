import { test, expect } from '@playwright/test'

/**
 * Testy ruchu. Nie robią snapshotów — sprawdzają, czy animacje w ogóle
 * ISTNIEJĄ w przeglądarce po minifikacji, i czy `prefers-reduced-motion`
 * naprawdę je wyłącza (AGENT-RULES §6).
 *
 * Wszystko leci na zbudowanej stronie, bo dokładnie tam te błędy żyją:
 * `astro dev` nie minifikuje CSS.
 */

/** Nazwy animacji faktycznie działających na elemencie, razem z typem osi czasu. */
const animationsOn = (selector: string) => (sel: string) => {
  const element = document.querySelector(sel)
  if (!element) return null
  return element.getAnimations().map((animation) => ({
    name: (animation as CSSAnimation).animationName,
    timeline: animation.timeline?.constructor.name ?? null,
  }))
}

test.describe('Animacje sterowane scrollem', () => {
  /*
   * Regresja z PLAYBOOK P-050.
   *
   * Lightning CSS bez jawnych targetów składa `animation` + `animation-timeline`
   * w jeden skrót z osią czasu w środku (`animation: linear both k view()`).
   * Chrome nie przyjmuje osi czasu w skrócie, więc odrzuca CAŁĄ deklarację —
   * animacja znika razem z nazwą. Przy `.who__word-bright`, które startuje
   * z `opacity: 0`, oznaczało to 29 NIEWIDOCZNYCH słów na produkcji.
   *
   * Test patrzy na `getAnimations()`, a nie na CSS, bo pytanie brzmi „czy
   * przeglądarka to przyjęła", a nie „czy tekst jest w pliku".
   */
  const scrollDriven = [
    { name: 'tło hero (parallaxa przy wyjściu)', selector: '.hero__backdrop img' },
    { name: 'orbita hero (kontr-parallaxa)', selector: '.hero__orbit' },
    { name: 'rozjaśniane słowa WhoWeAre', selector: '.who__word-bright' },
    { name: 'flara postępu VideoReviews', selector: '.vreviews__flare' },
  ]

  for (const { name, selector } of scrollDriven) {
    test(`${name} ma żywą oś czasu po minifikacji`, async ({ page }) => {
      await page.goto('/')

      const supported = await page.evaluate(() => CSS.supports('animation-timeline', 'view()'))
      test.skip(!supported, 'Przeglądarka nie zna osi czasu scrolla — fallback jest statyczny.')

      const animations = await page.evaluate(animationsOn(selector), selector)

      expect(animations, `brak elementu ${selector}`).not.toBeNull()
      expect(animations, `${selector} nie ma ani jednej animacji`).not.toHaveLength(0)
      /*
       * Sedno: oś czasu MUSI być scrollowa. Gdyby skrót znów zjadł `view()`,
       * animacja albo zniknie (długość 0), albo spadnie na `DocumentTimeline`
       * i odegra się raz przy wczytaniu zamiast jechać ze scrollem.
       */
      for (const animation of animations!) {
        expect(animation.timeline).toMatch(/^(View|Scroll)Timeline$/)
      }
    })
  }

  test('żadna reguła nie wpycha osi czasu do skrótu `animation`', async ({ page }) => {
    /*
     * Dubel powyższego, ale na całym zbudowanym CSS — łapie także bloki, które
     * akurat nie renderują się na stronie głównej, i mówi wprost, co jest nie
     * tak, zamiast zostawiać puste `getAnimations()` do zdiagnozowania.
     */
    await page.goto('/')

    const offenders = await page.evaluate(() =>
      [...document.styleSheets]
        .flatMap((sheet) => {
          try {
            return [...sheet.cssRules]
          } catch {
            return [] // arkusz z innego origin — nie nasz
          }
        })
        .flatMap(function walk(rule): string[] {
          const nested = 'cssRules' in rule ? [...(rule.cssRules as CSSRuleList)].flatMap(walk) : []
          const text = rule.cssText ?? ''
          const bad = /animation:[^;}]*(view\(\)|scroll\(\)|--[\w-]+\s*[;}])/.test(text)
          return bad ? [text.slice(0, 160), ...nested] : nested
        }),
    )

    expect(offenders, 'oś czasu w skrócie `animation` — patrz PLAYBOOK P-050').toEqual([])
  })
})

test.describe('Choreografia wejścia', () => {
  test('hero animuje się od razu, bez czekania na obserwatora', async ({ page }) => {
    await page.goto('/')

    const animations = await page.evaluate(animationsOn('.hero__heading'), '.hero__heading')

    expect(animations).not.toHaveLength(0)
    expect(animations![0].name).toBe('reveal-rise')
  })

  test('sekcja poniżej pierwszego ekranu czeka na wejście w kadr', async ({ page }) => {
    await page.goto('/')

    const groups = page.locator('[data-reveal-group]')
    const count = await groups.count()
    test.skip(count === 0, 'Żaden blok nie jest jeszcze grupą wejścia — wróci przy kolejnej partii.')

    // Ostatnia grupa jest najdalej od góry, więc na pewno jeszcze nie weszła.
    await expect(groups.last()).not.toHaveAttribute('data-inview', '')

    await groups.last().scrollIntoViewIfNeeded()
    await expect(groups.last()).toHaveAttribute('data-inview', '')
  })
})

test.describe('Przycisk: kłąb spod kursora', () => {
  /*
   * Pięć rodzin przycisków w projekcie dzieli jeden mechanizm (`.btn-wipe`).
   * Test sprawdza obie połowy efektu naraz: że kłąb dojeżdża do pełnej skali
   * i że etykieta zmienia kolor — bo to drugie potrafi po cichu przestać
   * działać przy zmianie warstw CSS (`.btn-wipe` MUSI zostać poza `@layer`,
   * inaczej style scoped komponentu wygrywają; powód jest w global.css).
   */
  /*
   * `flips` mówi, czy etykieta ma ZMIENIĆ kolor. Pigułki jasne (ciemny tekst na
   * bieli) muszą — inaczej ciemny tekst zostaje na czerwieni. Pigułki ciemne
   * mają etykietę jasną już w spoczynku i po wjeździe czerwieni zostaje ona
   * dokładnie tam, gdzie była; wymaganie zmiany byłoby tu wymaganiem regresu.
   */
  const buttons = [
    { name: 'hero', selector: '.hero__cta-face', flips: true },
    { name: 'nagłówek', selector: '.header__cta', flips: false },
    { name: 'CTA sekcji', selector: '.cta__button-face', flips: true },
    { name: 'WhyChooseUs', selector: '.why__button-face', flips: true },
    { name: 'pigułka z awatarem', selector: '.avatar-link', flips: true },
    { name: 'formularz kontaktowy', selector: '.button--primary', flips: true },
  ]

  for (const { name, selector, flips } of buttons) {
    test(`${name}: czerwień dojeżdża, a etykieta jaśnieje`, async ({ page }) => {
      await page.goto('/')

      const button = page.locator(selector).first()
      await button.scrollIntoViewIfNeeded()
      // Wejścia sekcji trwają 0,9 s — mierzymy dopiero, gdy przycisk stoi.
      await page.waitForTimeout(1200)

      const before = await page.evaluate(
        (sel) => getComputedStyle(document.querySelector(sel)!).color,
        selector,
      )

      const box = (await button.boundingBox())!
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.waitForTimeout(700)

      const after = await page.evaluate((sel) => {
        const element = document.querySelector(sel)!
        const wipe = getComputedStyle(element, '::before')
        return {
          color: getComputedStyle(element).color,
          /* `matrix(a, …)` — `a` jest skalą. Pełne pokrycie to a ≈ 1. */
          scale: Number(wipe.transform.match(/matrix\(([\d.]+)/)?.[1] ?? 0),
          surface: wipe.backgroundColor,
        }
      }, selector)

      expect(after.scale, 'kłąb nie dojechał do pełnej skali').toBeGreaterThan(0.9)
      expect(after.surface, 'płaszczyzna nie jest czerwienią marki').toBe('rgb(255, 0, 67)')
      const CONTRAST_ON_RED = 'rgb(254, 255, 241)'
      if (flips) {
        expect(after.color, 'etykieta nie zmieniła koloru — patrz warstwy w global.css').not.toBe(
          before,
        )
      }
      // Niezależnie od punktu startu etykieta ma wylądować na kolorze czytelnym
      // na czerwieni. To jest właściwe pytanie: nie „czy się zmieniła", tylko
      // „czy da się to przeczytać".
      expect(after.color, 'etykieta nie jest czytelna na czerwieni').toBe(CONTRAST_ON_RED)
    })
  }

  test('punkt wejścia kursora steruje środkiem kłębu', async ({ page }) => {
    /*
     * Bez skryptu z BaseLayout kłąb wychodzi ze środka przycisku. Ten test
     * pilnuje, że skrypt faktycznie działa — i przy okazji, że wyśrodkowanie
     * `translate(-50%, -50%)` nie zostało wyrzucone przez minifikator, bo
     * wtedy `--btn-x` przestaje odpowiadać ŚRODKOWI koła (PLAYBOOK P-050).
     */
    await page.goto('/')

    const button = page.locator('.hero__cta-face')
    const box = (await button.boundingBox())!

    /*
     * Wejść trzeba Z ZEWNĄTRZ. Skrypt słucha `pointerenter`, nie `pointermove`
     * — koło ma wyjść z punktu wejścia i tam wrócić, a nie gonić kursor po
     * przycisku. Ruch wewnątrz już najechanego przycisku niczego nie zmienia
     * i to jest zachowanie docelowe, nie przeoczenie.
     */
    await page.mouse.move(box.x - 40, box.y - 40)
    await page.mouse.move(box.x + 5, box.y + 5)
    await page.waitForTimeout(120)

    const origin = await page.evaluate(() => {
      const element = document.querySelector('.hero__cta-face')!
      const wipe = getComputedStyle(element, '::before')
      return {
        x: wipe.getPropertyValue('inset-inline-start'),
        y: wipe.getPropertyValue('inset-block-start'),
        transform: wipe.transform,
      }
    })

    // Kursor wszedł 5 px od lewego górnego rogu — tam ma być środek koła.
    expect(Number.parseFloat(origin.x)).toBeLessThan(12)
    expect(Number.parseFloat(origin.y)).toBeLessThan(12)
    // Wyśrodkowanie musi zostać w macierzy razem ze skalą, nie osobno.
    expect(origin.transform).toMatch(/matrix\(/)
  })
})

test.describe('Nagłówek', () => {
  test('pozycja menu przewija się na hoverze i niesie etykietę raz dla czytnika', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')

    const link = page.locator('.header__link').first()
    /*
     * Poniżej 1024 px nawigacji w pasku nie ma (menu mobilne powstaje razem
     * z blokiem nawigacji), a na profilu dotykowym `hover` i tak nie istnieje
     * jako stan — nie ma tu czego sprawdzać, więc test się pomija zamiast
     * udawać, że przeszedł.
     */
    test.skip(!(await link.isVisible()), 'Pasek nawigacji nie jest widoczny na tej szerokości.')
    const roll = link.locator('.header__roll')

    const resting = await roll.evaluate((node) => getComputedStyle(node).transform)
    expect(resting, 'w spoczynku maska nie może być przesunięta').toBe('none')

    await link.hover()
    /*
     * Odpytywanie stanu, nie czekanie zegarem: przewinięcie trwa
     * `--duration-slow`, ale start liczy się od chwili, w której przeglądarka
     * ZAUWAŻY hover, a ta nie jest związana z powrotem z `hover()`. Sztywne
     * `waitForTimeout` przechodzi na rozgrzanej maszynie i sypie się na zajętej.
     */
    await expect
      .poll(() => roll.evaluate((node) => getComputedStyle(node).transform), { timeout: 3000 })
      .not.toBe('none')

    // Kopia jest paliwem animacji, nie treścią — czytnik ma usłyszeć jedno.
    const copies = await link.locator('.header__label').count()
    const hidden = await link.locator('.header__label[aria-hidden="true"]').count()
    expect(copies).toBe(2)
    expect(hidden).toBe(1)
  })

  test('nagłówek wchodzi staggerem od razu, bez czekania na obserwatora', async ({ page }) => {
    await page.goto('/')

    const indices = await page.evaluate(() =>
      [...document.querySelectorAll('header .reveal')].map((element) =>
        getComputedStyle(element).getPropertyValue('--reveal-index').trim(),
      ),
    )

    // Logo, każda pozycja menu i CTA — kolejne, nierosnące losowo numery kroków.
    expect(indices.length).toBeGreaterThan(2)
    expect(indices).toEqual([...indices].sort((a, b) => Number(a) - Number(b)))
    expect(await page.locator('header [data-reveal-group]').count()).toBe(0)
  })
})

test.describe('Choreografia sekcji', () => {
  test('każda sekcja poniżej zgięcia trzyma klatkę startową i zwalnia ją w kadrze', async ({
    page,
  }) => {
    await page.goto('/')

    const groups = page.locator('[data-reveal-group]')
    const count = await groups.count()
    expect(count, 'żadna sekcja nie jest grupą wejścia').toBeGreaterThan(5)

    // Na starcie: wszystkie wstrzymane, nic nie zdążyło się odegrać na sucho.
    const held = await page.evaluate(() =>
      [...document.querySelectorAll('[data-reveal-group]')].filter((group) => {
        const first = group.querySelector('.reveal, .reveal-fade, .reveal-pop, .reveal-rule')
        return first?.getAnimations()[0]?.playState === 'paused'
      }).length,
    )
    expect(held, 'sekcja odegrała wejście, zanim ktokolwiek do niej doscrollował').toBe(count)

    // Po przewinięciu całej strony nic nie może zostać niewidoczne.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 300) {
        window.scrollTo(0, y)
        await new Promise((resolve) => setTimeout(resolve, 60))
      }
      window.scrollTo(0, document.body.scrollHeight)
    })
    await page.waitForTimeout(2500)

    const stuck = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('.reveal, .reveal-fade, .reveal-pop, .reveal-rule')]
        .filter((element) => Number(getComputedStyle(element).opacity) < 0.99)
        .map((element) => element.className),
    )
    expect(stuck, 'element został niewidoczny po przejściu przez cały kadr').toEqual([])
  })
})

test.describe('Wejścia a kolejność malowania', () => {
  /*
   * `.reveal` zostawia na elemencie `transform` — po animacji jest to macierz
   * jednostkowa, ale JAKAKOLWIEK wartość inna niż `none` tworzy kontekst
   * układania. Element z tą klasą przestaje więc przepuszczać `z-index` swoich
   * dzieci na zewnątrz: cokolwiek z niego wystaje, ląduje pod następnym
   * rodzeństwem. U nas zjadło to prawe połowy strzałek między krokami
   * w `HowWeWork` — i to jest pułapka, która wróci przy każdym kolejnym bloku
   * z ozdobnikiem na styku dwóch kafli.
   *
   * Test jest ogólny: przechodzi po WSZYSTKICH elementach z klasą wejścia,
   * znajduje potomków wystających poza ich obrys i sprawdza, czy w najbardziej
   * wystającym punkcie są na wierzchu. Nowy blok dostaje tę kontrolę za darmo.
   */
  test('nic, co wystaje poza animowany element, nie jest przykryte', async ({ page }) => {
    await page.goto('/')

    // Najpierw odegraj wszystkie wejścia — inaczej mierzymy klatkę przejściową.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 300) {
        window.scrollTo(0, y)
        await new Promise((resolve) => setTimeout(resolve, 50))
      }
    })
    await page.waitForTimeout(2200)

    const hosts = await page.$$('.reveal, .reveal-fade, .reveal-pop, .reveal-rule')
    const covered: string[] = []

    for (const host of hosts) {
      covered.push(
        ...(await host.evaluate((element) => {
          /*
           * Każdy gospodarz musi być w kadrze — `elementFromPoint` pracuje
           * w układzie okna, więc poza nim mierzylibyśmy przypadkowe miejsca.
           *
           * `behavior: 'instant'` jest tu WYMOGIEM, nie preferencją: strona ma
           * `scroll-behavior: smooth`, a `scrollIntoView` bez jawnego zachowania
           * dziedziczy je i wraca, zanim scroll dojedzie. Pomiar łapie wtedy
           * pozycję przejściową i test cicho przechodzi na zepsutym układzie —
           * dokładnie ten błąd popełniłem, pisząc go pierwszy raz.
           */
          element.scrollIntoView({ block: 'center', behavior: 'instant' })

          const hostBox = element.getBoundingClientRect()
          if (!hostBox.width) return []

          const found: string[] = []
          for (const child of element.querySelectorAll('*')) {
            const style = getComputedStyle(child)
            if (style.position !== 'absolute' && style.position !== 'fixed') continue
            if (style.display === 'none' || style.visibility === 'hidden') continue
            if (style.opacity === '0') continue

            const box = child.getBoundingClientRect()
            if (box.width < 2 || box.height < 2) continue

            const overRight = box.right > hostBox.right + 1
            const overLeft = box.left < hostBox.left - 1
            if (!overRight && !overLeft) continue

            const x = overRight ? box.right - 2 : box.left + 2
            const y = box.top + box.height / 2
            if (x < 1 || x > window.innerWidth - 1) continue
            if (y < 1 || y > window.innerHeight - 1) continue

            const onTop = document.elementFromPoint(x, y)
            if (!onTop || onTop === child) continue
            if (child.contains(onTop) || onTop.contains(child)) continue

            found.push(
              `${element.className.split(' ')[0]} > ${child.className || child.tagName}` +
                ` — przykryte przez ${onTop.className || onTop.tagName}`,
            )
          }
          return found
        })),
      )
    }

    expect([...new Set(covered)]).toEqual([])
  })
})

test.describe('Redukcja ruchu', () => {
  /*
   * `page.emulateMedia`, a NIE `test.use({ reducedMotion })`. W tej wersji
   * Playwrighta opcja kontekstu nie dociera do przeglądarki —
   * `matchMedia('(prefers-reduced-motion: reduce)')` w stronie zwraca `false`,
   * więc test przechodziłby, nie sprawdzając niczego. `emulateMedia` przed
   * `goto` działa i, co ważne, zdąża przed skryptem ładującym Lenisa.
   */
  test('wejścia lądują na klatce końcowej, nic nie zostaje niewidoczne', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    // Skrócone do 0,01 ms animacje potrzebują jednej klatki, żeby się domknąć.
    await page.waitForLoadState('networkidle')

    const stuck = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('.reveal, .reveal-fade, .reveal-pop, .who__word-bright')]
        .filter((element) => Number(getComputedStyle(element).opacity) < 0.99)
        .map((element) => element.className),
    )

    expect(stuck, 'element został na klatce startowej mimo `reduce`').toEqual([])
  })

  test('Lenis nie jest w ogóle pobierany', async ({ page }) => {
    const requests: string[] = []
    page.on('request', (request) => requests.push(request.url()))

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    expect(requests.filter((url) => /lenis/i.test(url))).toEqual([])
  })
})
