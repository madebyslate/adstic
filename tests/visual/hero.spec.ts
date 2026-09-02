import { test, expect } from './_motion-off'

test.describe('Blok Hero', () => {
  test('wygląda zgodnie z zaakceptowanym stanem', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)

    const hero = page.locator('section:has(#hero-heading)')
    await expect(hero).toBeVisible()
    await expect(hero).toHaveScreenshot('hero.png')
  })

  test('obraz tła jest elementem LCP: ładuje się natychmiast i jest preloadowany', async ({
    page,
  }) => {
    await page.goto('/')

    const background = page.locator('section:has(#hero-heading) img').first()
    await expect(background).toHaveAttribute('loading', 'eager')
    await expect(background).toHaveAttribute('fetchpriority', 'high')

    // Responsywny preload musi mieć ten sam srcset co obraz. Bez niego
    // przeglądarka pobiera najpierw `href` 1920 px, a potem drugi wariant.
    const preload = page.locator('link[rel="preload"][as="image"]')
    await expect(preload).toHaveAttribute('imagesizes', '100vw')
    expect(await preload.getAttribute('imagesrcset')).toBe(await background.getAttribute('srcset'))
  })

  test('obraz tła wypełnia sekcję, nie zostawia paska tła pod spodem', async ({ page }) => {
    /*
     * Regresja z PLAYBOOK P-011: `<img>` powstaje w `Picture.astro`, więc nie
     * dostaje `data-astro-cid-*` bloku Hero. Reguła `object-fit: cover` cicho
     * przestaje działać, a obraz wraca do wysokości własnej — na 390 px
     * zostawiało to ~570 px czarnego tła pod tłem. Typecheck tego nie widzi.
     */
    await page.goto('/')

    const box = await page.locator('section:has(#hero-heading)').boundingBox()
    const image = await page.locator('section:has(#hero-heading) img').first().boundingBox()

    expect(box).not.toBeNull()
    expect(image).not.toBeNull()
    expect(image!.height).toBeCloseTo(box!.height, 0)
  })

  test('tarcze orbity zostają w obrysie rysunku (obrót na mobile)', async ({ page }) => {
    /*
     * Regresja PLAYBOOK P-049: poniżej 768 px kontener orbity jest obrócony
     * o 90°, a tarcze dostają kontrobrót. Kolejność składania transformacji to
     * translate → rotate → scale → offset → transform, więc kontrobrót zapisany
     * własnością `rotate` działa PO przesunięciu po torze i wyrzuca tarcze poza
     * kadr (zmierzone: x ≈ 520–960 px przy kontenerze −22…412 px). Wygląda to
     * jak „orbita bez logotypów" i nie widać tego w typechecku ani w snapshocie
     * zrobionym w chwili, gdy akurat żadna tarcza nie jest w kadrze.
     */
    await page.goto('/')

    const orbit = await page.locator('[class*="hero__orbit"]').first().boundingBox()
    expect(orbit).not.toBeNull()

    const discs = await page.locator('.orbit-logo').all()
    expect(discs.length).toBeGreaterThan(0)

    for (const disc of discs) {
      const box = await disc.boundingBox()
      expect(box).not.toBeNull()
      // Tolerancja 1 px na zaokrąglenia; tarcza ma leżeć NA torze, czyli
      // w obrysie rysunku, niezależnie od punktu startu.
      expect(box!.x).toBeGreaterThanOrEqual(orbit!.x - 1)
      expect(box!.x + box!.width).toBeLessThanOrEqual(orbit!.x + orbit!.width + 1)
      expect(box!.y).toBeGreaterThanOrEqual(orbit!.y - 1)
      expect(box!.y + box!.height).toBeLessThanOrEqual(orbit!.y + orbit!.height + 1)
    }
  })

  test('nagłówek jest jedynym h1 i niesie treść mimo gradientu', async ({ page }) => {
    await page.goto('/')

    const headings = page.locator('h1')
    await expect(headings).toHaveCount(1)
    await expect(headings).toHaveAttribute('id', 'hero-heading')
    await expect(headings).not.toBeEmpty()
  })

  test('ocena ma opis dla czytnika ekranu, gwiazdki są poza drzewem dostępności', async ({
    page,
  }) => {
    await page.goto('/')

    const hero = page.locator('section:has(#hero-heading)')
    await expect(hero.locator('.sr-only')).toHaveText(/5/)
    // Pięć gwiazdek, wszystkie pod rodzicem z `aria-hidden` — same w sobie
    // nie niosą treści, więc do nazwy dostępnej trafia wyłącznie `rating.label`.
    await expect(hero.locator('span[aria-hidden="true"] svg')).toHaveCount(5)
  })

  test('przy ograniczeniu ruchu zostaje poster i wideo nie jest pobierane', async ({ page }) => {
    /*
     * `is:inline` przy skrypcie autoplay jest tu wymogiem, nie stylem — zwykły
     * <script> Astro wynosi do bundla niezależnie od warunku wokół niego.
     *
     * Skrypt Hero jest inline, ale przy `reduce` nie może nawet rozpocząć
     * pobierania źródła. Obraz LCP pozostaje wtedy jedynym widocznym tłem.
     */
    const videoRequests: string[] = []
    page.on('request', (request) => {
      if (request.resourceType() === 'media') videoRequests.push(request.url())
    })

    await page.goto('/', { waitUntil: 'networkidle' })

    const video = page.locator('[data-hero-video]')
    await expect(video).toHaveAttribute('preload', 'none')
    await expect(video).not.toHaveAttribute('data-playing', '')
    expect(videoRequests.filter((url) => url.includes('/video/hero-bg'))).toEqual([])
  })

  test('każde źródło wideo hero jest częścią buildu', async ({ page, request }) => {
    await page.goto('/')

    const sources = await page.locator('[data-hero-video] source').evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('src')).filter((src): src is string => Boolean(src)),
    )
    expect(sources).toHaveLength(4)

    for (const source of sources) {
      const response = await request.get(source)
      expect(response.status(), source).toBe(200)
    }
  })

  test('po załadowaniu strony poster ustępuje odtwarzanemu wideo', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto('/')

    const video = page.locator('[data-hero-video]')
    await expect(video).toHaveAttribute('data-playing', '', { timeout: 10_000 })
    expect(await video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThan(0)
  })
})
