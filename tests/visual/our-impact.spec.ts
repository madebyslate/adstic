import type { Page } from '@playwright/test'

import { test, expect } from './_motion-off'

const SECTION = 'section:has(#our-impact-heading)'

/*
 * PUŁAPKA: `contentDocument.readyState` iframe'a bez `src` to już `'complete'` —
 * `about:blank` jest gotowym dokumentem. Czekanie na nie przepuszcza test, zanim
 * panel w ogóle wystartuje. Rozstrzyga dopiero korzeń dokumentu: `<svg>`.
 */
const waitForPanel = (page: Page) =>
  page.waitForFunction(
    () =>
      document.querySelector<HTMLIFrameElement>('.impact__dashboard')?.contentDocument
        ?.documentElement?.tagName === 'svg',
  )

test.describe('Blok OurImpact', () => {
  test('wygląda zgodnie z zaakceptowanym stanem', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)

    const section = page.locator(SECTION)
    await section.scrollIntoViewIfNeeded()
    // Łuna i panel są `lazy` — bez tego snapshot łapie pustą sekcję. Łuna jest
    // obrazem, panel osobnym dokumentem w iframe, więc czeka się na nie osobno.
    await expect(section.locator('img')).toHaveCount(1)
    await page.waitForFunction((selector) => {
      const node = document.querySelector(selector)
      return [...(node?.querySelectorAll('img') ?? [])].every(
        (img) => img.complete && img.naturalWidth > 0,
      )
    }, SECTION)
    await waitForPanel(page)

    await expect(section).toHaveScreenshot('our-impact.png')
  })

  test('łuna wtapia się w tło: wygaszona maską, bez trybu mieszania', async ({ page }) => {
    /*
     * To jest cały mechanizm tego bloku (spec.md → „Wtopienie łuny"). Kadr JPG
     * jest ciemniejszy od tła strony, więc każda jego krawędź jest odcięciem —
     * maska musi dojść do pełnej przezroczystości ZANIM plik się skończy.
     * `mix-blend-mode` był wcześniejszym podejściem i jest tu jawnie wykluczony:
     * screen podnosi cały prostokąt o ~2/255 i odcięcia wracają.
     */
    await page.goto('/')

    const section = page.locator(SECTION)
    const glow = page.locator(`${SECTION} .impact__glow`)

    const mask = await glow.evaluate((node) => getComputedStyle(node).maskImage)
    expect(mask).toContain('radial-gradient')
    // Przeglądarka serializuje `transparent` jako `rgba(0, 0, 0, 0)`.
    expect(mask).toMatch(/transparent|rgba\(0, 0, 0, 0\)/)

    await expect(glow).toHaveCSS('mix-blend-mode', 'normal')
    // Ujemny z-index działa tylko w grupie kompozycji sekcji — bez izolacji
    // łuna schowałaby się pod tłem malowanym przez tę samą sekcję.
    await expect(section).toHaveCSS('isolation', 'isolate')
    await expect(section).toHaveCSS('background-color', 'rgb(13, 15, 13)')
  })

  test('łuna jest poza drzewem dostępności, panel ma opis', async ({ page }) => {
    await page.goto('/')

    const section = page.locator(SECTION)
    await expect(section.locator('.impact__glow')).toHaveAttribute('aria-hidden', 'true')

    // Panel jest osobnym dokumentem — jego opisem jest `title` iframe, nie `alt`.
    const dashboard = section.locator('.impact__dashboard')
    await expect(dashboard).toHaveAttribute('title', /Dashboard Adstic/)
    await expect(dashboard).toHaveAttribute('loading', 'lazy')
    // Panel nie wchodzi w kolejność Tab: to demo wizualne, nie kontrolki.
    await expect(dashboard).toHaveAttribute('tabindex', '-1')
  })

  /*
   * PUŁAPKA (PLAYBOOK P-066). Skala nad `<iframe>` każe przeglądarce rasterować
   * zagnieżdżony dokument przy KAŻDEJ wartości skali — panel ma 0,5 MB ścieżek
   * i własne animacje, więc przejazd przez sekcję zaciął stronę, a grupy SVG
   * z własnym `transform` odjeżdżały ze swoich miejsc. Test pilnuje wniosku,
   * nie kosztu: panel nie ma osi czasu scrolla ani transformacji.
   */
  test('panel nie jest skalowany przez scroll', async ({ page }) => {
    await page.goto('/')

    const screen = page.locator(`${SECTION} .impact__screen`)
    await screen.scrollIntoViewIfNeeded()

    await expect(screen).not.toHaveClass(/scroll-settle|scroll-parallax/)
    await expect(screen).toHaveCSS('transform', 'none')
    await expect(screen).toHaveCSS('will-change', 'auto')
  })

  /*
   * Kółko nad iframe nie dociera do Lenis — dokument SVG przekazuje deltę przez
   * `postMessage`. Musi trafić do Lenis, nie do natywnego `scrollBy`: to dwa
   * źródła prawdy o pozycji scrolla i strona szarpie się między nimi.
   */
  test('delta kółka z panelu idzie przez wspólne wejście scrolla', async ({ page }) => {
    await page.goto('/')

    const screen = page.locator(`${SECTION} .impact__screen`)
    await screen.scrollIntoViewIfNeeded()
    // Panel jest `lazy`: dopóki dokument SVG się nie wczyta, nie ma czemu wysłać
    // komunikatu i test przechodziłby na pustym przebiegu.
    await waitForPanel(page)

    const relayed = await page.evaluate(async () => {
      type Relay = { adsticScrollByWheel?: (deltaX: number, deltaY: number) => void }
      const target = window as unknown as Relay

      const seen: number[] = []
      const original = target.adsticScrollByWheel
      target.adsticScrollByWheel = (deltaX, deltaY) => seen.push(deltaY)

      const frame = document.querySelector<HTMLIFrameElement>('.impact__dashboard')
      // Ten komunikat ma zostać odrzucony: pochodzi z okna strony, nie z panelu.
      window.postMessage({ type: 'adstic-dashboard:wheel', deltaX: 0, deltaY: 999 }, '*')
      frame?.contentWindow?.dispatchEvent(new WheelEvent('wheel', { deltaY: 120 }))
      await new Promise((done) => setTimeout(done, 100))

      target.adsticScrollByWheel = original
      return seen
    })

    expect(relayed).toEqual([120])
  })

  test('SVG zawiera animację nazwanych warstw i redukcję ruchu', async ({ page }) => {
    await page.goto('/')

    const section = page.locator(SECTION)
    await section.scrollIntoViewIfNeeded()
    const src = await section.locator('.impact__dashboard').getAttribute('data-src')
    expect(src).toBeTruthy()

    const svg = await page.evaluate(async (url) => (await fetch(url)).text(), src!)
    expect(svg).toContain('[id^="chart-fill"]')
    expect(svg).toContain('#progressbar-fill')
    expect(svg).toContain('@media (prefers-reduced-motion: reduce)')
    // Pętle wykresów to transformacje SVG, których Chrome nie kompozytuje —
    // poza kadrem strona musi mieć czym je zatrzymać.
    expect(svg).toContain('.is-paused *')
  })

  test('nagłówkiem sekcji jest zdanie, nie etykieta nad nim', async ({ page }) => {
    await page.goto('/')

    const heading = page.locator('#our-impact-heading')
    await expect(heading).toHaveRole('heading')
    await expect(heading).toHaveText('Miej wskaźniki swojego biznesu pod ręką')

    // Etykieta zostaje akapitem — inaczej sekcja miałaby dwa nagłówki.
    await expect(page.locator(`${SECTION} p.impact__eyebrow`)).toHaveText('Nasz wpływ')
  })
})
