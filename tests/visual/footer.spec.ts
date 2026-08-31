import { test, expect } from './_motion-off'

test.describe('Stopka', () => {
  test('wygląda zgodnie z zaakceptowanym stanem', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)

    const footer = page.locator('footer')
    await expect(footer).toBeVisible()
    await expect(footer).toHaveScreenshot('footer.png')
  })

  test('menu stopki niesie te same pozycje co nagłówek, plus linki prawne', async ({ page }) => {
    /*
     * Kolumny stopki są liczone z `mainNavigation`, a nie przepisane ręcznie.
     * Ten test pilnuje właśnie tego: gdy ktoś doda pozycję w nagłówku i stopka
     * jej nie pokaże (albo odwrotnie), rozjazd widać tutaj, a nie na produkcji.
     */
    await page.goto('/')

    /*
     * Nazwy DOSTĘPNE, nie `innerText`. Pozycje w nagłówku niosą etykietę dwa
     * razy — kopia jest paliwem dla przewinięcia na hoverze i ma `aria-hidden`,
     * więc do nazwy dostępnej nie wchodzi, ale do `innerText` owszem. Poza tym
     * to i tak jest właściwsza miara: pytanie brzmi „czy użytkownik dostaje tę
     * samą pozycję", a nie „czy w DOM-ie stoją te same znaki".
     */
    const names = async (scope: string) =>
      Promise.all(
        (await page.locator(`${scope} a`).all()).map((link) =>
          link.evaluate((node) => {
            const label = node.getAttribute('aria-label')
            if (label) return label

            // Poddrzewa `aria-hidden` nie wchodzą do nazwy dostępnej — a to
            // właśnie tam siedzi kopia etykiety napędzająca przewinięcie.
            const copy = node.cloneNode(true) as HTMLElement
            copy.querySelectorAll('[aria-hidden="true"]').forEach((node) => node.remove())
            return copy.textContent?.trim()
          }),
        ),
      )

    /*
      Pasek, a nie cały `<header>`: te same pozycje stoją drugi raz w płycie
      menu mobilnego, więc `header nav a` zwracałoby je podwójnie. Porównanie
      paska z płytą to osobne pytanie i osobny test (`header.spec.ts`).
    */
    const headerLinks = await names('header nav[aria-label="Nawigacja główna"]')
    const footerLinks = await names('footer nav')

    expect(footerLinks.slice(0, headerLinks.length)).toEqual(headerLinks)
    expect(footerLinks.slice(headerLinks.length)).toEqual(['Privacy Policy', 'Terms of Use'])
  })

  test('każdy link społecznościowy ma dostępną nazwę', async ({ page }) => {
    /* Ikony nie niosą tekstu — bez `aria-label` to dla czytnika cztery „link". */
    await page.goto('/')

    const links = page.locator('footer ul[aria-label] a')
    await expect(links).toHaveCount(4)

    for (const link of await links.all()) {
      expect(await link.getAttribute('aria-label')).toBeTruthy()
    }
  })
})
