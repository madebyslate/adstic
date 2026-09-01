import { test, expect } from './_motion-off'

const SECTION = 'section:has(#our-impact-heading)'

test.describe('Blok OurImpact', () => {
  test('wygląda zgodnie z zaakceptowanym stanem', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)

    const section = page.locator(SECTION)
    await section.scrollIntoViewIfNeeded()
    // Oba zasoby są `lazy` — bez tego snapshot łapie pustą sekcję.
    await expect(section.locator('img')).toHaveCount(2)
    await page.waitForFunction((selector) => {
      const node = document.querySelector(selector)
      return [...(node?.querySelectorAll('img') ?? [])].every(
        (img) => img.complete && img.naturalWidth > 0,
      )
    }, SECTION)

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

    const dashboard = section.locator('.impact__screen img')
    await expect(dashboard).toHaveAttribute('alt', /Dashboard Adstic/)
    await expect(dashboard).toHaveAttribute('loading', 'lazy')
  })

  test('SVG zawiera animację nazwanych warstw i redukcję ruchu', async ({ page }) => {
    await page.goto('/')

    const section = page.locator(SECTION)
    await section.scrollIntoViewIfNeeded()
    const src = await section.locator('.impact__screen img').getAttribute('src')
    expect(src).toBeTruthy()

    const svg = await page.evaluate(async (url) => (await fetch(url)).text(), src!)
    expect(svg).toContain('[id^="chart-fill"]')
    expect(svg).toContain('#progressbar-fill')
    expect(svg).toContain('@media (prefers-reduced-motion: reduce)')
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
