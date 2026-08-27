import { test, expect } from './_motion-off'

const SECTION = 'section:has(#case-studies-heading)'

async function settle(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)

  const section = page.locator(SECTION)
  await section.scrollIntoViewIfNeeded()
  // 4 kadry + 4 loga na kaflach + 3 loga wierszy + twarz w pigułce CTA.
  // Wszystkie `lazy` — bez tego snapshot łapie sekcję z pustymi kaflami.
  await expect(section.locator('img')).toHaveCount(12)
  await page.waitForFunction((selector) => {
    const node = document.querySelector(selector)
    return [...(node?.querySelectorAll('img') ?? [])].every(
      (img) => img.complete && img.naturalWidth > 0,
    )
  }, SECTION)

  return section
}

test.describe('Blok CaseStudies', () => {
  test('wygląda zgodnie z zaakceptowanym stanem', async ({ page }) => {
    const section = await settle(page)
    await expect(section).toHaveScreenshot('case-studies.png')
  })

  test('strzałka kafla wchodzi dopiero pod kursorem', async ({ page, isMobile }) => {
    /*
     * To jest jedyny stan tego bloku (spec.md → „Stany"). Na dotyku hovera nie
     * ma, więc strzałka jest widoczna od razu — i dokładnie ta różnica jest tu
     * sprawdzana, a nie sam fakt istnienia strzałki.
     */
    const section = await settle(page)
    const arrow = section.locator('.tile__arrow').first()

    if (isMobile) {
      await expect(arrow).toHaveCSS('opacity', '1')
      return
    }

    await expect(arrow).toHaveCSS('opacity', '0')
    await section.locator('.tile').first().hover()
    await expect(arrow).toHaveCSS('opacity', '1')
  })

  test('kreska nad sekcją jest szersza niż treść — siedzi na kolumnie, nie na sekcji', async ({
    page,
  }) => {
    /*
     * Regresja, którą łatwo wprowadzić przy porządkowaniu paddingów: przeniesienie
     * `border-block-start` z `container-page` na `<section>` rozciąga kreskę na
     * całą szerokość okna i sekcja przestaje wyglądać jak w złożeniu.
     */
    const section = await settle(page)
    const inner = section.locator('.cases__inner')

    await expect(inner).toHaveCSS('border-top-width', '1px')
    await expect(section).toHaveCSS('border-top-width', '0px')

    const innerBox = await inner.boundingBox()
    const headingBox = await section.locator('#case-studies-heading').boundingBox()
    expect(innerBox!.width).toBeGreaterThan(headingBox!.width)
  })

  test('kafle i wiersze to listy linków, strzałki poza drzewem dostępności', async ({ page }) => {
    const section = await settle(page)

    await expect(section.locator('.cases__grid > li')).toHaveCount(4)
    await expect(section.locator('.cases__list > li')).toHaveCount(3)

    // Treścią linku jest wynik, nie „czytaj więcej" — nazwa dostępna musi to nieść.
    await expect(section.locator('.tile').first()).toHaveAccessibleName(
      'HANDMADE SHOP Growth in 3 years 700%',
    )

    for (const arrow of await section.locator('.tile__arrow, .row__arrow').all()) {
      await expect(arrow).toHaveAttribute('aria-hidden', 'true')
    }

    // Wszystko pod foldem — priorytet zostaje przy elemencie LCP w hero.
    for (const img of await section.locator('img').all()) {
      await expect(img).toHaveAttribute('loading', 'lazy')
    }
  })
})
