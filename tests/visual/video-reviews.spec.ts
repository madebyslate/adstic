import { test, expect } from './_motion-off'

const SECTION = 'section:has(#video-reviews-heading)'

test.describe('Blok VideoReviews', () => {
  test('wygląda zgodnie z zaakceptowanym stanem', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)

    const section = page.locator(SECTION)
    await section.scrollIntoViewIfNeeded()
    // Postery idą `lazy` — bez tego snapshot łapie karuzelę pustych kafli.
    await page.waitForLoadState('networkidle')

    await expect(section).toHaveScreenshot('video-reviews.png')
  })

  test('każdy <source> odpowiada realnym plikiem (PLAYBOOK P-048)', async ({ page, request }) => {
    /*
     * Sedno P-048: pliki z `public/video/` były w `.gitignore`, więc każdy
     * lokalny krok weryfikacji przechodził na plikach, których nie ma w
     * repozytorium. Ten test odpytuje ADRESY — pada tak samo, gdy plik nie
     * doszedł do `dist/`, jak i wtedy, gdy nigdy nie wyszedł poza czyjś dysk.
     */
    await page.goto('/')

    /*
     * Adresy czytamy z wyzwalaczy, nie z elementu <video>: w kafelku go nie ma,
     * a lightbox dostaje źródła dopiero przy kliknięciu.
     */
    const sources = await page.locator(`${SECTION} [data-play]`).evaluateAll((nodes) =>
      nodes.flatMap((node) =>
        (JSON.parse((node as HTMLElement).dataset.sources ?? '[]') as { src: string }[]).map(
          (source) => source.src,
        ),
      ),
    )

    expect(sources.length).toBeGreaterThan(0)

    for (const src of new Set(sources)) {
      const response = await request.head(src)
      expect(response.status(), `${src} nie istnieje pod tym adresem`).toBe(200)
    }
  })

  test('wideo nie kosztuje ani bajta przy wejściu na stronę', async ({ page }) => {
    /*
     * Trzy nagrania to ~5,5 MB. Cała sekcja opiera się na tym, że nie ruszają
     * się z miejsca, dopóki ktoś nie kliknie play — `preload="none"` jest tu
     * warunkiem mieszczenia się w budżecie, nie optymalizacją.
     */
    const media: string[] = []
    page.on('request', (request) => {
      if (request.resourceType() === 'media' || request.url().endsWith('.mp4')) {
        media.push(request.url())
      }
    })

    await page.goto('/', { waitUntil: 'networkidle' })
    await page.locator(SECTION).scrollIntoViewIfNeeded()
    await page.waitForLoadState('networkidle')

    expect(media).toEqual([])
    await expect(page.locator(`${SECTION} [data-lightbox-video]`)).toHaveAttribute(
      'preload',
      'none',
    )
  })

  test('bez skryptu karuzela zostaje, strzałki znikają', async ({ browser }) => {
    /*
     * Kontrakt bloku z HTML-em (spec → „Budżet"): przewijanie działa bez JS,
     * a kontrolka, która bez JS nic nie robi, nie ma prawa się pokazać.
     */
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto('/')

    await expect(page.locator(`${SECTION} [data-track]`)).toHaveCSS('overflow-x', 'auto')
    await expect(page.locator(`${SECTION} [data-nav]`)).toBeHidden()

    // Przycisk play jest wtedy zwykłym linkiem do pliku — działa, tylko inaczej.
    const play = page.locator(`${SECTION} [data-play]`).first()
    await expect(play).toHaveAttribute('href', /\.mp4$/)

    await context.close()
  })

  test('strzałka wstecz startuje wygaszona, w przód — nie', async ({ page }) => {
    await page.goto('/')
    await page.locator(SECTION).scrollIntoViewIfNeeded()

    const back = page.locator(`${SECTION} [data-step="-1"]`)
    const forward = page.locator(`${SECTION} [data-step="1"]`)

    await expect(back).toBeDisabled()
    await expect(forward).toBeEnabled()

    await forward.click()
    // Smooth scroll — czekamy na stan, nie na czas.
    await expect(back).toBeEnabled()
  })

  test('kafel jest plakatem — nagranie gra w lightboxie, nie w kafelku', async ({ page }) => {
    /*
     * Odtwarzanie w kadrze 380 px wyglądało źle, a pełny ekran rozjeżdżał się
     * podwójnie: `object-fit: cover` przycinał kadr, a sąsiednie kafle
     * wychodziły NAD warstwę pełnoekranową. Stąd jedno <video> na sekcję,
     * w <dialog> otwieranym przez `showModal()` (top layer).
     */
    await page.goto('/')
    await page.locator(SECTION).scrollIntoViewIfNeeded()

    await expect(page.locator(`${SECTION} [data-card] video`)).toHaveCount(0)
    await expect(page.locator(`${SECTION} [data-lightbox-video]`)).toHaveCount(1)

    const dialog = page.locator(`${SECTION} [data-lightbox]`)
    await expect(dialog).toBeHidden()

    await page.locator(`${SECTION} [data-play]`).nth(1).click()
    await expect(dialog).toBeVisible()

    // W oknie gra DOKŁADNIE to nagranie, w które kliknięto.
    const expected = await page
      .locator(`${SECTION} [data-play]`)
      .nth(1)
      .getAttribute('href')
    await expect(page.locator(`${SECTION} [data-lightbox-video] source`).first()).toHaveAttribute(
      'src',
      expected!,
    )

    // Kadr w oknie pokazuje CAŁE nagranie — `cover` z kafelka by je przyciął.
    await expect(page.locator(`${SECTION} [data-lightbox-video]`)).toHaveCSS(
      'object-fit',
      'contain',
    )
  })

  test('zamknięcie okna zrywa pobieranie, nie tylko pauzuje', async ({ page }) => {
    /*
     * Samo `pause()` zostawia otwarte pobieranie: 2,5-megabajtowy plik leci
     * dalej w tle po zamknięciu okna. Dlatego przy zamknięciu czyścimy źródła
     * i wołamy `load()`.
     */
    await page.goto('/')
    await page.locator(SECTION).scrollIntoViewIfNeeded()

    const dialog = page.locator(`${SECTION} [data-lightbox]`)
    await page.locator(`${SECTION} [data-play]`).first().click()
    await expect(dialog).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()

    await expect(page.locator(`${SECTION} [data-lightbox-video] source`)).toHaveCount(0)

    /*
     * `currentSrc` zostaje w Chrome z poprzedniego nagrania nawet po `load()`,
     * więc nie jest dowodem na nic. Dowodem jest `networkState` — NETWORK_EMPTY
     * (0) znaczy, że element nie ma żadnego zasobu i niczego nie pobiera.
     */
    /*
     * Odpytywanie, nie jeden strzał: `load()` zeruje `networkState` dopiero
     * w kolejnym obrocie pętli zdarzeń, więc odczyt tuż po `Escape` łapie
     * czasem jeszcze NETWORK_NO_SOURCE (3). Pytanie brzmi „czy pobieranie
     * ustaje", a nie „czy ustało w tej mikrosekundzie".
     */
    await expect
      .poll(
        () =>
          page
            .locator(`${SECTION} [data-lightbox-video]`)
            .evaluate((video: HTMLVideoElement) => ({
              paused: video.paused,
              networkState: video.networkState,
            })),
        { timeout: 3000 },
      )
      .toEqual({ paused: true, networkState: 0 })
  })

  test('czytnik ekranu dostaje nazwisko przy każdym przycisku play', async ({ page }) => {
    /*
     * Trzy identyczne „Play" w rzędzie nie mówią nic — etykieta musi nieść to,
     * co odróżnia jedno nagranie od drugiego.
     */
    await page.goto('/')

    const plays = page.locator(`${SECTION} [data-play]`)
    const count = await plays.count()
    expect(count).toBeGreaterThanOrEqual(3)

    for (let index = 0; index < count; index += 1) {
      await expect(plays.nth(index)).toHaveAttribute('aria-label', /.+ — play video review/)
    }

    // Kreska z flarą jest wskaźnikiem wizualnym — pozycję niesie stan karuzeli.
    await expect(page.locator(`${SECTION} .vreviews__rail`)).toHaveAttribute('aria-hidden', 'true')
  })
})
