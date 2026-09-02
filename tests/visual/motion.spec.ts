import { test, expect, type Page } from '@playwright/test'

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

test.describe('Tła wideo AdPlacements', () => {
  const SECTION = 'section:has(#ad-placements-heading)'
  const VIDEO_REQUEST = '/video/placements/'

  test('ładują się dopiero w kadrze i trafiają do właściwych kafli', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    const requests: string[] = []
    page.on('request', (request) => {
      if (request.url().includes(VIDEO_REQUEST)) requests.push(request.url())
    })

    await page.goto('/')

    const videos = page.locator(`${SECTION} [data-placement-video]`)
    await expect(videos).toHaveCount(2)
    expect(requests, 'wideo konkuruje o sieć z pierwszym ekranem').toEqual([])

    const sources = videos.locator('source')
    await expect(sources.nth(0)).toHaveAttribute(
      'data-src',
      '/video/placements/shopping-campaigns-bg-v1.webm',
    )
    await expect(sources.nth(1)).toHaveAttribute(
      'data-src',
      '/video/placements/video-campaigns-bg-v1.webm',
    )
    await expect(sources.nth(0)).not.toHaveAttribute('src', /.+/)
    await expect(sources.nth(1)).not.toHaveAttribute('src', /.+/)

    for (const video of await videos.all()) {
      await video.scrollIntoViewIfNeeded()
      await expect(video.locator('source')).toHaveAttribute('src', /\.webm$/)
      /*
       * Ustawiony `src` to jeszcze nie obraz. Przy niepełnym ciągu kodeka
       * (`codecs=av01` zamiast `av01.0.08M.08`) `canPlayType` zwraca "",
       * przeglądarka odrzuca CAŁY `<source>` i kafel zostaje na obrazie
       * fallbacku — a wszystkie asercje wyżej nadal przechodzą. `data-playing`
       * jest jedynym dowodem, że dekoder to przyjął: leci z eventu `playing`
       * i to on odsłania wideo (`opacity`).
       */
      await expect(video).toHaveAttribute('data-playing', '')
    }

    await expect.poll(() => requests.length).toBe(2)
  })

  test('przy ograniczeniu ruchu zostają obrazy i wideo nie jest pobierane', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const requests: string[] = []
    page.on('request', (request) => {
      if (request.url().includes(VIDEO_REQUEST)) requests.push(request.url())
    })

    await page.goto('/')
    const videos = page.locator(`${SECTION} [data-placement-video]`)

    for (const video of await videos.all()) await video.scrollIntoViewIfNeeded()
    await page.waitForTimeout(100)

    await expect(videos.locator('source').nth(0)).not.toHaveAttribute('src', /.+/)
    await expect(videos.locator('source').nth(1)).not.toHaveAttribute('src', /.+/)
    expect(requests).toEqual([])
  })
})

test.describe('Ikony kropkowe: mruganie i deszcz', () => {
  const ICON = 'section:has(#why-choose-heading) .why-item__icon'

  test('kropki kształtu mrugają losowo, a nie falą po rysunku', async ({ page }) => {
    /*
     * Ikony idą inline właśnie po to, żeby każda kropka kształtu miała własną
     * fazę I własne tempo. Jedno bez drugiego nie wystarcza: przy wspólnym
     * okresie układ domyka się po jednym obrocie i oko czyta z tego rytm.
     *
     * Kluczowa asercja jest jednak inna: faza NIE MOŻE być funkcją pozycji.
     * Gdyby ktoś wrócił do fazy liczonej z przekątnej (tak wyglądała pierwsza
     * wersja tej animacji), przez rysunek pojechałby uporządkowany pas —
     * animacja nadal by DZIAŁAŁA i żaden snapshot by tego nie złapał.
     */
    await page.goto('/')

    const dots = await page.evaluate(
      (sel) =>
        [...document.querySelectorAll(`${sel} .dot-icon__face circle`)].map((dot) => ({
          phase: Number(getComputedStyle(dot).getPropertyValue('--dot-phase')),
          rate: Number(getComputedStyle(dot).getPropertyValue('--dot-rate')),
          diagonal: Number(dot.getAttribute('cx')) + Number(dot.getAttribute('cy')),
        })),
      ICON,
    )

    expect(dots.length).toBeGreaterThan(10)
    expect(new Set(dots.map((dot) => dot.phase)).size, 'kropki dzielą fazę').toBeGreaterThan(10)
    expect(new Set(dots.map((dot) => dot.rate)).size, 'kropki dzielą tempo').toBeGreaterThan(10)

    // Współczynnik korelacji Pearsona między fazą a pozycją na przekątnej.
    const mean = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / values.length
    const phases = dots.map((dot) => dot.phase)
    const places = dots.map((dot) => dot.diagonal)
    const [mp, ml] = [mean(phases), mean(places)]
    const cov = mean(dots.map((_, i) => (phases[i]! - mp) * (places[i]! - ml)))
    const sd = (values: number[], m: number) =>
      Math.sqrt(mean(values.map((value) => (value - m) ** 2)))
    const correlation = Math.abs(cov / (sd(phases, mp) * sd(places, ml)))

    expect(correlation, 'faza kropki wynika z jej pozycji — to fala, nie losowe mruganie').toBeLessThan(0.4)
  })

  test('deszcz w tle leci z góry na dół, kolumna po kolumnie', async ({ page }) => {
    /*
     * Sedno efektu: w kolumnie kropek tła zapala się kolejno coraz niższa.
     * Sprawdzalne jest to na fazie, a nie na zrzucie: faza wchodzi jako UJEMNE
     * opóźnienie, więc kropka z fazą WIĘKSZĄ dobija do zapłonu wcześniej —
     * w kolumnie faza musi więc MALEĆ w dół. Odwrócenie znaku w parserze daje
     * deszcz lecący do góry, co wygląda jak animacja i przechodzi każdy snapshot.
     *
     * Faza jest liczona MODULO CYKL, więc kolumna, której przelot przechodzi
     * przez granicę cyklu, ma w środku skok w górę (…0,03 → 0,99…). To nie jest
     * usterka, tylko zawinięcie — dlatego porównujemy różnice modulo 1, a nie
     * same wartości. Różnica „w dół" jest mała, różnica „w górę" bliska 1.
     */
    await page.goto('/')

    const columns = await page.evaluate((sel) => {
      // Grupujemy w obrębie JEDNEJ ikony — dwa rysunki mają ten sam viewBox,
      // więc wspólne `cx` posklejałoby ich kolumny w jedną.
      const icon = document.querySelector(sel)!
      const byColumn = new Map<string, { cy: number; phase: number }[]>()
      for (const dot of icon.querySelectorAll('.dot-icon__grid circle')) {
        const key = dot.getAttribute('cx')!
        byColumn.set(key, [
          ...(byColumn.get(key) ?? []),
          {
            cy: Number(dot.getAttribute('cy')),
            phase: Number(getComputedStyle(dot).getPropertyValue('--dot-phase')),
          },
        ])
      }
      return [...byColumn.values()].map((column) => column.sort((a, b) => a.cy - b.cy))
    }, ICON)

    expect(columns.length).toBeGreaterThan(4)

    for (const column of columns) {
      for (let index = 1; index < column.length; index += 1) {
        const step = column[index - 1]!.phase - column[index]!.phase
        const forward = step - Math.floor(step) // różnica modulo cykl
        expect(
          forward,
          `kolumna nie zapala się z góry na dół: ${column.map((dot) => dot.phase).join(', ')}`,
        ).toBeLessThan(0.5)
      }
    }

    // Kolumny startują w różnych momentach — inaczej deszcz pada jednym frontem.
    const starts = columns.map((column) => column[0]!.phase)
    expect(new Set(starts).size, 'wszystkie kolumny startują równo').toBeGreaterThan(3)
  })

  test('animacje przeżywają minifikację i chodzą w pętli na zegarze', async ({ page }) => {
    await page.goto('/')

    const face = `${ICON} .dot-icon__face circle`
    const glow = `${ICON} .dot-icon__glow circle`
    const grid = `${ICON} .dot-icon__grid circle`

    const onFace = await page.evaluate(animationsOn(face), face)
    const onGlow = await page.evaluate(animationsOn(glow), glow)
    const onGrid = await page.evaluate(animationsOn(grid), grid)

    expect(onFace, `brak elementu ${face}`).not.toBeNull()
    expect(onFace!.map((animation) => animation.name)).toContain('dot-icon-face-blink')
    expect(onGlow!.map((animation) => animation.name)).toContain('dot-icon-glow-blink')
    expect(onGrid!.map((animation) => animation.name)).toContain('dot-icon-rain')
    // Zegar, nie scroll — ikony żyją także wtedy, gdy strona stoi.
    expect(onFace![0].timeline).toBe('DocumentTimeline')
    expect(onGrid![0].timeline).toBe('DocumentTimeline')
  })

  test('przy `reduce` ikona stoi dokładnie w stanie spoczynkowym', async ({ page }) => {
    /*
     * Cykle są nieskończone, a globalna reguła `prefers-reduced-motion` skraca
     * je do 0,01 ms i wymusza jedną iterację — czyli sadza kropki na klatce
     * KOŃCOWEJ. Gdyby ktoś przestawił keyframe'y tak, że cykl kończy się
     * w zapłonie, użytkownik z `reduce` dostałby kropki tła rozpalone na stałe,
     * a kształt przygaszony. Testy wizualne przyjęłyby to bez mrugnięcia, bo
     * robią zrzuty dokładnie w tym stanie (PLAYBOOK P-061).
     */
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.locator(ICON).first().scrollIntoViewIfNeeded()

    const resting = await page.evaluate(
      (sel) => ({
        face: [...document.querySelectorAll(`${sel} .dot-icon__face circle`)].map((dot) =>
          Number(getComputedStyle(dot).opacity),
        ),
        glow: [...document.querySelectorAll(`${sel} .dot-icon__glow circle`)].map(
          (dot) => getComputedStyle(dot).transform,
        ),
        grid: [...document.querySelectorAll(`${sel} .dot-icon__grid circle`)].map((dot) =>
          Number(getComputedStyle(dot).opacity),
        ),
      }),
      ICON,
    )

    expect(Math.min(...resting.face), 'kształt został przygaszony przy `reduce`').toBeGreaterThan(
      0.99,
    )
    for (const opacity of resting.grid) {
      expect(opacity, 'kropka tła została rozpalona przy `reduce`').toBeCloseTo(0.095, 3)
    }
    // `none` albo macierz jednostkowa — byle nie rozdmuchana poświata.
    for (const transform of resting.glow) {
      expect(transform, 'poświata została rozdmuchana przy `reduce`').toMatch(
        /^(none|matrix\(1, 0, 0, 1, 0, 0\))$/,
      )
    }
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
  /*
   * `only` i `prepare` istnieją dla jednego przypadku: pigułka nagłówka ma dwa
   * wcielenia. Powyżej 1024 px stoi w pasku, poniżej — w płycie menu, którą
   * najpierw trzeba otworzyć. To ten sam mechanizm w dwóch miejscach, więc
   * pytanie zadajemy w obu, zamiast odpuszczać je na telefonie.
   */
  const buttons = [
    { name: 'hero', selector: '.hero__cta-face', flips: true },
    { name: 'nagłówek', selector: '.header__cta', flips: false, only: 'wide' as const },
    {
      name: 'menu mobilne',
      selector: '.header__menu-cta',
      flips: false,
      only: 'narrow' as const,
      prepare: async (page: Page) => {
        await page.locator('header button[popovertarget]').click()
        await expect(page.locator('#site-menu')).toBeVisible()
      },
    },
    { name: 'CTA sekcji', selector: '.cta__button-face', flips: true },
    { name: 'WhyChooseUs', selector: '.why__button-face', flips: true },
    { name: 'pigułka z awatarem', selector: '.avatar-link', flips: true },
    { name: 'formularz kontaktowy', selector: '.button--primary', flips: true },
  ]

  for (const { name, selector, flips, only, prepare } of buttons) {
    test(`${name}: czerwień dojeżdża, a etykieta jaśnieje`, async ({ page }) => {
      const wide = (page.viewportSize()?.width ?? 0) >= 1024
      test.skip(only === 'wide' && !wide, 'Ten przycisk stoi w pasku dopiero od 1024 px.')
      test.skip(only === 'narrow' && wide, 'Ten przycisk mieszka w menu, które istnieje do 1024 px.')

      await page.goto('/')
      await prepare?.(page)

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

  test('ramka przycisku wsiąka w kłąb, zamiast zostać obcym pierścieniem', async ({ page }) => {
    /*
     * Jedyny przycisk z widoczną ramką (`.button--ghost`, „Wstecz" w kroku 2)
     * niesie `.btn-wipe` NA SOBIE, a kłąb siedzi w pudełku dopełnienia — więc
     * ramka zostaje nad czerwienią. Ma się z nią zlać, a nie zniknąć do
     * przezroczystości: przezroczysta ramka pokazałaby prześwit płyty sekcji.
     */
    await page.goto('/')

    const section = page.locator('section:has(#contact-heading)')
    await section.locator('label.option').first().click()
    await section.locator('[data-next]').click()

    const back = section.locator('[data-back]')
    await expect(back).toBeVisible()

    /*
     * Czekamy, aż CAŁA sekcja stanie: wejście trwa 0,9 s (klik przewinął ją
     * w kadr, więc właśnie ruszyło), a zamiana kroku 0,38 s razem z wysokością
     * płyty. Zmierzony wcześniej `boundingBox()` wskazuje miejsce, w którym za
     * chwilę nic nie będzie, a kursor postawiony obok przycisku nie odpala
     * hoveru — i test pada bez związku z tym, o co pyta.
     */
    await section.evaluate((element) =>
      Promise.all(
        element.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => {})),
      ),
    )

    const box = (await back.boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.waitForTimeout(900)

    const border = await back.evaluate((element) => getComputedStyle(element).borderTopColor)
    expect(border, 'ramka nie zlała się z czerwienią marki').toBe('rgb(255, 0, 67)')
  })

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

/**
 * Zamiana kroku w kreatorze kontaktu, zbadana JEDNYM `evaluate`: klik i pytanie
 * o stan muszą trafić w tę samą klatkę, bo całe przejście trwa 0,38 s i po
 * `await` na osobne zapytanie już go nie ma.
 */
const swapContactStep = async (page: Page) => {
  /*
   * Najpierw czekamy, aż skrypt kreatora się wykona: przed nim „Dalej" jest
   * `hidden` (bez JS nie ma czego przełączać), więc klik w niego nic nie robi
   * i test pyta o przejście, którego nikt nie zaczął. Bez tego pada raz na
   * kilkanaście przebiegów, tylko przy obciążonej maszynie.
   */
  await expect(page.locator('[data-contact-form] [data-next]')).toBeVisible()

  return page.evaluate(() => {
    const form = document.querySelector<HTMLFormElement>('[data-contact-form]')!
    const stage = form.querySelector<HTMLElement>('[data-steps]')!
    const goal = form.querySelector<HTMLInputElement>('[data-goal]')!

    goal.checked = true
    form.querySelector<HTMLButtonElement>('[data-next]')!.click()

    return {
      leaving: form.querySelectorAll('.step--leaving').length,
      stageAnimations: stage.getAnimations().length,
      incomingAnimations: form.querySelector('[data-step="1"]')!.getAnimations().length,
      /* Przycięcie sceny żyje tylko na czas ruchu wysokości. */
      clipped: getComputedStyle(stage).overflow !== 'visible',
      incomingHidden: form.querySelector<HTMLElement>('[data-step="1"]')!.hidden,
    }
  })
}

test.describe('Kreator kontaktu', () => {
  /*
   * Spec bloku mówi wprost, że krok PRZENIKA, a nie przeskakuje (Contact.spec.md
   * → „Animacje"). Trzy rzeczy muszą jechać naraz — odchodzący krok, wchodzący
   * i wysokość sceny — bo zabranie którejkolwiek zamienia płynną zamianę
   * w skok: bez animacji wysokości przyciski pod formularzem szarpią o kilka-
   * dziesiąt pikseli w pierwszej klatce.
   */
  test('krok przenika, a wysokość płyty dojeżdża razem z nim', async ({ page }) => {
    await page.goto('/')

    const state = await swapContactStep(page)

    expect(state.incomingHidden, 'krok 2 miał się odsłonić od razu').toBe(false)
    expect(state.leaving, 'krok 1 zniknął zamiast odjechać').toBe(1)
    expect(state.incomingAnimations, 'krok 2 wskoczył bez ruchu').toBeGreaterThan(0)
    expect(state.stageAnimations, 'wysokość sceny nie jedzie — przyciski skoczą').toBeGreaterThan(0)
    expect(state.clipped, 'bez przycięcia wyższy krok wylewa się na przyciski').toBe(true)
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

  test('menu mobilne nie każe czekać na kaskadę pozycji', async ({ page }) => {
    /*
     * Kaskada pozycji menu jedzie na `transition-delay`, a globalna reguła
     * redukcji zeruje opóźnienia ANIMACJI, nie PRZEJŚĆ — bez lokalnego
     * `--menu-stagger: 0ms` użytkownik z `reduce` czekałby ćwierć sekundy na
     * menu, które „się nie animuje". Test pyta o ostatnią pozycję, bo to ona
     * czeka najdłużej.
     */
    test.skip((page.viewportSize()?.width ?? 0) >= 1024, 'Menu istnieje do 1024 px.')

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')

    await page.locator('header button[popovertarget]').click()
    const last = page.locator('#site-menu .header__menu-item').last()
    await expect(last).toBeVisible()

    const delay = await last.evaluate((element) => getComputedStyle(element).transitionDelay)
    expect(new Set(delay.split(', '))).toEqual(new Set(['0s']))
  })

  test('kreator kontaktu podmienia krok natychmiast', async ({ page }) => {
    /*
     * Przejście kroków jedzie na Web Animations, a globalna reguła skracająca
     * animacje dotyczy WYŁĄCZNIE tych z CSS — skrypt musi sam zapytać
     * `matchMedia`. Bez tego użytkownik z `reduce` dostaje pełne 0,38 s ruchu,
     * o które prosił, żeby go nie było.
     */
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')

    const state = await swapContactStep(page)

    expect(state.incomingHidden).toBe(false)
    expect(state.leaving, 'krok odchodzący został na wierzchu').toBe(0)
    expect(state.stageAnimations).toBe(0)
    expect(state.incomingAnimations).toBe(0)
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

test.describe('Hover sekcji treściowych', () => {
  /*
   * Trzy sekcje (`WhoWeAre`, `HowWeWork`, `CaseStudies`) odpowiadają na kursor.
   * Test pilnuje mechaniki, nie wyglądu — wygląd trzymają snapshoty, a te
   * hoveru nie widzą, bo mysz stoi poza kadrem.
   *
   * Sedno jest w PLAYBOOK P-057: wszystkie te kafle niosą klasę wejścia,
   * a jej wypełnienie (`animation-fill-mode: both`) BIJE zwykłe deklaracje
   * `transform`, `translate`, `scale` i `opacity`. Ruch musi więc dostać
   * DZIECKO kafla, nie kafel. Gdyby ktoś to kiedyś „uprościł", przenosząc
   * przekształcenie na gospodarza, efekt zniknie po cichu — i wtedy czerwony
   * jest ten plik, a nie oko klienta.
   */
  const settle = async (page: Page) => {
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 300) {
        window.scrollTo(0, y)
        await new Promise((resolve) => setTimeout(resolve, 40))
      }
    })
    await page.waitForTimeout(1500)
  }

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    const pointer = await page.evaluate(() => matchMedia('(hover: hover)').matches)
    test.skip(!pointer, 'Profil dotykowy — stan `hover` tu nie istnieje.')
    await settle(page)
  })

  test('WhoWeAre: kafel ze statystyką jaśnieje, zapala ikonę i wpuszcza poświatę', async ({
    page,
  }) => {
    const card = page.locator('.card--stat').first()
    await card.scrollIntoViewIfNeeded()

    const read = () =>
      card.evaluate((element) => ({
        background: getComputedStyle(element).backgroundColor,
        icon: getComputedStyle(element.querySelector('.card__icon')!).color,
        glow: Number(getComputedStyle(element, '::before').opacity),
        /* Kafel MA stać w miejscu — to jest wymóg, nie efekt uboczny (P-057). */
        moved: getComputedStyle(element).translate,
      }))

    const before = await read()
    expect(before.glow, 'poświata jest widoczna bez kursora').toBe(0)

    await card.hover()
    await expect.poll(async () => (await read()).glow, { timeout: 3000 }).toBeGreaterThan(0.9)

    const after = await read()
    expect(after.background, 'kafel nie zareagował tłem').not.toBe(before.background)
    expect(after.icon, 'ikona nie zapaliła się czerwienią').toBe('rgb(255, 0, 85)')
    expect(after.moved, 'kafel się przesunął — to i tak zbiłaby animacja wejścia').toBe(before.moved)
  })

  test('WhoWeAre: kadr osoby zbliża się, ramka kafla stoi', async ({ page }) => {
    const card = page.locator('.card--person').first()
    await card.scrollIntoViewIfNeeded()

    const media = card.locator('.card__media')
    const frame = (await media.boundingBox())!

    await card.hover()
    await expect
      .poll(
        () => card.locator('.card__media img').evaluate((img) => getComputedStyle(img).scale),
        { timeout: 3000 },
      )
      .not.toBe('none')

    // Rośnie zdjęcie, nie kadr — inaczej kafel rozepchnąłby siatkę sekcji.
    expect((await media.boundingBox())!.width).toBeCloseTo(frame.width, 1)
  })

  test('HowWeWork: krok jaśnieje, opis staje się czytelny, strzałka rusza dalej', async ({
    page,
  }) => {
    const step = page.locator('.step').first()
    await step.scrollIntoViewIfNeeded()

    const description = step.locator('.step__description')
    const arrow = step.locator('.step__arrow svg')
    const arrowShown = await arrow.isVisible()

    const before = {
      background: await step.evaluate((element) => getComputedStyle(element).backgroundColor),
      color: await description.evaluate((element) => getComputedStyle(element).color),
    }

    await step.hover()
    await expect
      .poll(() => step.evaluate((element) => Number(getComputedStyle(element, '::before').opacity)), {
        timeout: 3000,
      })
      .toBeGreaterThan(0.9)

    const after = {
      background: await step.evaluate((element) => getComputedStyle(element).backgroundColor),
      color: await description.evaluate((element) => getComputedStyle(element).color),
    }

    expect(after.background, 'krok nie zareagował tłem').not.toBe(before.background)
    // 40 % krycia to ≈ 3,1:1, czyli poniżej AA — pod kursorem tekst ma być pełny.
    expect(after.color, 'opis nie rozjaśnił się do pełnego krycia').toBe('rgb(248, 247, 244)')

    if (arrowShown) {
      expect(
        await arrow.evaluate((element) => getComputedStyle(element).translate),
        'strzałka nie ruszyła w stronę kroku następnego',
      ).not.toBe('none')
    }
  })

  test('CaseStudies: kadr kafla zbliża się, a strzałka dojeżdża na miejsce', async ({ page }) => {
    const tile = page.locator('.tile').first()
    await tile.scrollIntoViewIfNeeded()

    const box = (await tile.boundingBox())!
    const arrow = tile.locator('.tile__arrow')

    expect(
      Number(await arrow.evaluate((element) => getComputedStyle(element).opacity)),
      'strzałka jest widoczna bez kursora',
    ).toBe(0)

    await tile.hover()
    await expect
      .poll(() => tile.locator('img').first().evaluate((img) => getComputedStyle(img).scale), {
        timeout: 3000,
      })
      .not.toBe('none')

    await expect
      .poll(() => arrow.evaluate((element) => Number(getComputedStyle(element).opacity)), {
        timeout: 3000,
      })
      .toBeGreaterThan(0.9)

    // Strzałka wraca z odsunięcia do zera, a kafel nie zmienia rozmiaru.
    await expect
      .poll(() => arrow.evaluate((element) => getComputedStyle(element).translate), {
        timeout: 3000,
      })
      .toMatch(/^(none|0px)$/)
    expect((await tile.boundingBox())!.width).toBeCloseTo(box.width, 1)
  })

  test('redukcja ruchu zostawia kolory, zabiera drogę', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await settle(page)

    const tile = page.locator('.tile').first()
    await tile.scrollIntoViewIfNeeded()
    await tile.hover()
    await page.waitForTimeout(300)

    const state = await tile.evaluate((element) => ({
      zoom: getComputedStyle(element.querySelector('img')!).scale,
      arrow: getComputedStyle(element.querySelector('.tile__arrow')!).translate,
      shown: getComputedStyle(element.querySelector('.tile__arrow')!).opacity,
    }))

    expect(state.zoom, 'zbliżenie zostało przeskokiem').toMatch(/^(none|1)$/)
    expect(state.arrow, 'strzałka wciąż ma dystans do przebycia').toMatch(/^(none|0px)$/)
    // Afordancja zostaje: to informacja, nie ruch.
    expect(Number(state.shown)).toBeGreaterThan(0.9)
  })
})
