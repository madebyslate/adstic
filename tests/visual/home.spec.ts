import { test, expect } from './_motion-off'

/**
 * Snapshot referencyjny strony głównej.
 *
 * Wzorzec dla testów kolejnych bloków: jeden `describe` na blok, snapshot
 * sekcji (nie całej strony), desktop + mobile z konfiguracji projektów.
 */
test.describe('Strona główna', () => {
  test('renderuje się bez zmian wizualnych', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    /*
     * Zdjęcia bloków idą `loading="lazy"`, a `fullPage` fotografuje CAŁĄ
     * stronę — przewijając ją dopiero W TRAKCIE zrzutu. Sam `networkidle`
     * niczego tu nie gwarantuje: sieć jest bezczynna, bo obrazy spod folda
     * jeszcze się nie zaczęły ładować. Im dłuższa strona, tym większa szansa,
     * że snapshot złapie pusty kadr — dlatego zdejmujemy `lazy` i czekamy na
     * dekodowanie, zanim zrobimy zdjęcie.
     */
    await page.evaluate(() => {
      document
        .querySelectorAll('img[loading="lazy"]')
        .forEach((image) => image.setAttribute('loading', 'eager'))
    })
    await page.evaluate(() =>
      Promise.all(Array.from(document.images).map((image) => image.decode().catch(() => undefined))),
    )
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveScreenshot('home.png', { fullPage: true })
  })

  test('ma dokładnie jeden <h1>', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toHaveCount(1)
  })

  test('nie ujawnia prywatnych adresów w HTML', async ({ page }) => {
    // Ten sam warunek, co w odbiorze wdrożenia (standard xCloud §25).
    const html = await page.goto('/').then((response) => response!.text())

    expect(html).not.toContain('payload:3000')
    expect(html).not.toContain(':8080')
    expect(html).not.toContain('x-static-build-token')
  })
})
