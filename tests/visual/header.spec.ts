import { test, expect } from './_motion-off'

const MENU = '#site-menu'

test.describe('Nagłówek strony', () => {
  test('wygląda zgodnie z zaakceptowanym stanem', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)

    const header = page.locator('header')
    await expect(header).toBeVisible()
    await expect(header).toHaveScreenshot('header.png')
  })

  test('logo i skrajny element paska są odsunięte od krawędzi tak samo', async ({ page }) => {
    /*
     * Siatka nagłówka ma trzy kolumny tylko wtedy, gdy nawigacja jest widoczna.
     * Przy ukrytej nawigacji (poniżej 1024 px) trzecia kolumna `1fr` ściągała
     * CTA na środek. Symetria marginesów łapie to niezależnie od breakpointu
     * i nie zna wartości samego marginesu — porównuje lewą stronę z prawą.
     *
     * Skrajnym elementem jest CTA na desktopie i IKONA przycisku menu na
     * mobile — nie sam przycisk: jego pudełko to cel dotykowy 44 px, więc
     * wystaje poza rytm paska celowo (ujemny margines w `Header.astro`).
     */
    await page.goto('/')

    const cta = page.locator('header a[href="/contact/"]').first()
    const edge = (await cta.isVisible()) ? cta : page.locator('header button[popovertarget] > span')

    const inner = await page.locator('header .header__inner').boundingBox()
    const logo = await page.locator('header a[href="/"]').boundingBox()
    const box = await edge.boundingBox()

    expect(inner).not.toBeNull()
    expect(logo).not.toBeNull()
    expect(box).not.toBeNull()

    const left = logo!.x - inner!.x
    const right = inner!.x + inner!.width - (box!.x + box!.width)
    expect(right).toBeCloseTo(left, 0)
  })

  test('poniżej 1024 px nawigacja mieszka w menu, powyżej w pasku', async ({ page }) => {
    await page.goto('/')

    const wide = (page.viewportSize()?.width ?? 0) >= 1024
    await expect(page.locator('nav[aria-label="Nawigacja główna"]')).toBeVisible({ visible: wide })
    await expect(page.locator('header button[popovertarget]')).toBeVisible({ visible: !wide })
    /* Płyta jest zamknięta w obu przypadkach — na desktopie dodatkowo `display: none`. */
    await expect(page.locator(MENU)).toBeHidden()
  })
})

test.describe('Menu mobilne', () => {
  test.skip(
    ({ viewport }) => (viewport?.width ?? 0) >= 1024,
    'Menu istnieje tylko poniżej 1024 px — w pasku nawigacja stoi rozwinięta.',
  )

  test('przycisk otwiera płytę z kompletem pozycji i zamyka ją ponownym kliknięciem', async ({
    page,
  }) => {
    await page.goto('/')

    const toggle = page.locator('header button[popovertarget]')
    const menu = page.locator(MENU)

    await expect(menu).toBeHidden()
    await toggle.click()
    await expect(menu).toBeVisible()

    /*
     * Menu ma nieść DOKŁADNIE te same pozycje co pasek desktopowy plus CTA —
     * jedno i drugie liczy się z `mainNavigation`, więc test pilnuje, że nikt
     * nie dołożył pozycji tylko w jednym miejscu. Porównujemy ADRESY, bo tylko
     * one są wspólne obu układom: pasek niesie etykietę zdublowaną pod
     * `aria-hidden` (patrz DECISIONS), płyta pojedynczo.
     */
    const hrefs = (scope: string) =>
      page.locator(`${scope} a`).evaluateAll((links) =>
        links.map((link) => link.getAttribute('href')),
      )

    expect(await hrefs(MENU)).toEqual([
      ...(await hrefs('header nav[aria-label="Nawigacja główna"]')),
      '/contact/',
    ])

    await toggle.click()
    await expect(menu).toBeHidden()
  })

  test('otwarcie sadza fokus w płycie, a wczytanie strony go nie rusza', async ({ page }) => {
    /*
     * Bez tego menu jest dla klawiatury nie do przejścia. Specyfikacja obiecuje
     * przejście tabem z wywołującego prosto do popovera, ale WebKit tak nie
     * robi — `Tab` ląduje w elemencie strony POD płytą. Stąd `autofocus` na
     * pierwszej pozycji i ten test, bo to zachowanie przeglądarki, nie nasze.
     *
     * Druga połowa pytania: `autofocus` w zamkniętej płycie ma być BEZCZYNNY —
     * gdyby zabierał fokus przy wczytaniu, strona zaczynałaby się od menu.
     */
    await page.goto('/')

    const inMenu = () =>
      page.evaluate(() => Boolean(document.activeElement?.closest('#site-menu')))

    expect(await inMenu(), 'menu zabrało fokus przy wczytaniu strony').toBe(false)

    await page.locator('header button[popovertarget]').click()
    await expect(page.locator(MENU)).toBeVisible()
    await expect.poll(inMenu, { message: 'fokus nie wszedł do płyty' }).toBe(true)
  })

  test('Esc zamyka menu i oddaje fokus przyciskowi', async ({ page }) => {
    await page.goto('/')

    const toggle = page.locator('header button[popovertarget]')
    const menu = page.locator(MENU)

    /*
     * Otwarcie KLAWIATURĄ, nie kliknięciem: WebKit na dotyku nie ustawia fokusu
     * na klikniętym przycisku, więc po `Esc` nie miałby go dokąd oddać i test
     * pytałby o zachowanie, którego nikt tam nie obiecywał. Pytanie brzmi
     * „czy użytkownik klawiatury wraca tam, skąd wszedł".
     */
    await toggle.focus()
    await page.keyboard.press('Enter')
    await expect(menu).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(menu).toBeHidden()
    await expect(toggle).toBeFocused()
  })

  test('przy otwartym menu strona pod spodem nie scrolluje', async ({ page }) => {
    /*
     * Popover nie jest modalem, więc blokady scrolla nie dostaje za darmo —
     * robi ją `html:has(#site-menu:popover-open) { overflow: hidden }`. Test
     * czyta tę własność z korzenia, bo gestu nie ma czym wykonać: `mouse.wheel`
     * jest w mobilnym WebKicie nieobsługiwane, a scroll programowy (`scrollTo`)
     * działa mimo `overflow: hidden` z definicji — mierzyłby więc nie to.
     */
    await page.goto('/')

    const overflow = () =>
      page.evaluate(() => getComputedStyle(document.documentElement).overflowY)

    expect(await overflow()).not.toBe('hidden')

    await page.locator('header button[popovertarget]').click()
    await expect(page.locator(MENU)).toBeVisible()
    await expect.poll(overflow).toBe('hidden')
  })

  test('otwarte menu wygląda zgodnie z zaakceptowanym stanem', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)

    await page.locator('header button[popovertarget]').click()
    await expect(page.locator(MENU)).toBeVisible()

    /* Zrzut całego ekranu, nie elementu: płyta leży w warstwie wierzchniej,
       poza pudełkiem nagłówka, więc zrzut nagłówka by jej nie objął. */
    await expect(page).toHaveScreenshot('header-menu-open.png')
  })
})
