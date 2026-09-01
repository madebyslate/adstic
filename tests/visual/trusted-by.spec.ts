import { test, expect } from './_motion-off'

const SECTION = 'section:has(#trusted-by-heading)'

test.describe('Blok TrustedBy', () => {
  test('wygląda zgodnie z zaakceptowanym stanem', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)

    const section = page.locator(SECTION)
    await expect(section).toBeVisible()
    await expect(section).toHaveScreenshot('trusted-by.png')
  })

  test('tor marquee jest szerszy od swojego okna — pętla nie pokazuje pustki', async ({ page }) => {
    /*
     * Liczba kopii listy w torze liczy się przy buildzie. Gdyby spadła za nisko
     * (krótsza lista logotypów, szerszy ekran), pas w połowie cyklu kończyłby
     * się pustym tłem. Statycznie tego nie widać — snapshot łapie tylko klatkę 0.
     */
    await page.goto('/')

    const rows = page.locator(`${SECTION} .wall__row`)
    await expect(rows).toHaveCount(2)

    for (const row of await rows.all()) {
      const window_ = await row.boundingBox()
      const track = await row.locator('.wall__track').boundingBox()

      expect(window_).not.toBeNull()
      expect(track).not.toBeNull()
      // Tor przesuwa się o jedną kopię, więc reszta toru musi zakryć okno.
      expect(track!.width).toBeGreaterThanOrEqual(2 * window_!.width)
    }
  })

  test('czytnik ekranu dostaje każdą markę raz, mimo kopii w torze', async ({ page }) => {
    await page.goto('/')

    const section = page.locator(SECTION)
    await expect(section.locator('.wall__track')).toHaveCount(2)

    // Kopie są poza drzewem dostępności…
    for (const track of await section.locator('.wall__track').all()) {
      await expect(track).toHaveAttribute('aria-hidden', 'true')
    }

    // …a nazwy marek przychodzą z jednej ukrytej listy.
    const names = section.locator('ul.sr-only li')
    await expect(names).toHaveCount(1)
    await expect(names.first()).toHaveText('bura.')
  })

  test('kafel logotypu jest kwadratem i nie skaluje się z ekranem', async ({ page }) => {
    await page.goto('/')

    const tile = await page.locator(`${SECTION} .wall__tile`).first().boundingBox()
    expect(tile).not.toBeNull()
    expect(tile!.width).toBeCloseTo(160, 0)
    expect(tile!.height).toBeCloseTo(160, 0)
  })

  test('etykieta sekcji jest nagłówkiem, a kwadracik nie wchodzi do treści', async ({ page }) => {
    await page.goto('/')

    const heading = page.locator('#trusted-by-heading')
    await expect(heading).toHaveRole('heading')
    await expect(heading).toHaveText('Zaufali nam liderzy rynku')
  })
})
