import { test, expect } from './_motion-off'

test.describe('Nagłówek strony', () => {
  test('wygląda zgodnie z zaakceptowanym stanem', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)

    const header = page.locator('header')
    await expect(header).toBeVisible()
    await expect(header).toHaveScreenshot('header.png')
  })

  test('logo i CTA są odsunięte od krawędzi tak samo', async ({ page }) => {
    /*
     * Siatka nagłówka ma trzy kolumny tylko wtedy, gdy nawigacja jest widoczna.
     * Przy ukrytej nawigacji (poniżej 1024 px) trzecia kolumna `1fr` ściągała
     * CTA na środek. Symetria marginesów łapie to niezależnie od breakpointu
     * i nie zna wartości samego marginesu — porównuje lewą stronę z prawą.
     */
    await page.goto('/')

    const inner = await page.locator('header > div').boundingBox()
    const logo = await page.locator('header a[href="/"]').boundingBox()
    const cta = await page.locator('header a[href="/contact/"]').boundingBox()

    expect(inner).not.toBeNull()
    expect(logo).not.toBeNull()
    expect(cta).not.toBeNull()

    const left = logo!.x - inner!.x
    const right = inner!.x + inner!.width - (cta!.x + cta!.width)
    expect(right).toBeCloseTo(left, 0)
  })
})
