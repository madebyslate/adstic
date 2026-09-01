import { test, expect } from "./_motion-off";

const SECTION = "section:has(#ad-placements-heading)";

test.describe("Blok AdPlacements", () => {
  test("wygląda zgodnie z zaakceptowanym stanem", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);

    const section = page.locator(SECTION);
    await section.scrollIntoViewIfNeeded();
    // Makiety idą `loading="lazy"` — bez tego zrzut łapie puste kadry.
    await page.waitForFunction(
      (selector) =>
        Array.from(document.querySelectorAll(`${selector} img`)).every(
          (img) => (img as HTMLImageElement).complete,
        ),
      SECTION,
    );

    await expect(section).toHaveScreenshot("ad-placements.png");
  });

  test("wiersz to 8 + 5 kolumn, drugi 5 + 8", async ({ page }) => {
    test.skip(
      (page.viewportSize()?.width ?? 0) < 1024,
      "Poniżej 1024 px kafle stoją w jednej albo dwóch równych kolumnach.",
    );

    /*
     * To jest wymaganie z makiety, a nie efekt uboczny układu: szerokość kafla
     * wynika z POZYCJI na liście (spec → „Pola”), więc pierwszy i czwarty mają
     * być szerokie, drugi i trzeci wąskie. Gdyby ktoś przeniósł tę decyzję do
     * danych, ten test padnie przy pierwszej treści, która ustawi to inaczej.
     */
    await page.goto("/");

    const widths = await page
      .locator(`${SECTION} .tile`)
      .evaluateAll((nodes) =>
        nodes.map((node) => Math.round(node.getBoundingClientRect().width)),
      );

    expect(widths).toHaveLength(4);
    expect(widths[0]).toBe(widths[3]);
    expect(widths[1]).toBe(widths[2]);
    expect(widths[0]).toBeGreaterThan(widths[1]);
    // Kafle w wierszu dzielą 13 kolumn siatki: 8 do 5.
    expect(widths[0] / (widths[0] + widths[1])).toBeCloseTo(8 / 13, 2);
  });

  test("kafle w wierszu mają jedną wysokość", async ({ page }) => {
    test.skip(
      (page.viewportSize()?.width ?? 0) < 768,
      "W jednej kolumnie nie ma wiersza, więc nie ma czego zrównywać.",
    );
    await page.goto("/");

    const heights = await page
      .locator(`${SECTION} .tile`)
      .evaluateAll((nodes) =>
        nodes.map((node) => Math.round(node.getBoundingClientRect().height)),
      );

    expect(heights[0]).toBe(heights[1]);
    expect(heights[2]).toBe(heights[3]);
  });

  test("makieta bez tła dotyka dolnej krawędzi kafla i nie rozpycha go", async ({
    page,
  }) => {
    /*
     * Reguła kompozycji ze spec.md: brak `background` = makieta stoi NA dolnej
     * krawędzi kafla, bez luzu pod spodem, i przenika w nią przez wygaszenie.
     * Jest wyjęta z przepływu (`absolute`) właśnie po to, żeby pełna wysokość
     * telefonu nie rozciągała kafla — bez tego kafle w wierszu urosłyby do 800 px.
     */
    await page.goto("/");
    await page.locator(SECTION).scrollIntoViewIfNeeded();

    const tile = page.locator(`${SECTION} .tile--device`).first();

    const [tileBottom, imageBottom] = await Promise.all([
      tile.evaluate((node) => node.getBoundingClientRect().bottom),
      tile.locator("img").evaluate((node) => node.getBoundingClientRect().bottom),
    ]);

    // Sam obrys kafla (1 px) jest jedynym, co dzieli makietę od krawędzi.
    expect(Math.abs(tileBottom - imageBottom)).toBeLessThanOrEqual(1);
    await expect(tile).toHaveCSS("overflow-y", "hidden");
    await expect(tile).toHaveCSS("padding-bottom", "0px");
  });

  test("makieta z tłem stoi w środku kadru", async ({ page }) => {
    await page.goto("/");
    await page.locator(SECTION).scrollIntoViewIfNeeded();

    const float = page.locator(`${SECTION} .tile__media--float`).first();

    const [box, image] = await Promise.all([
      float.evaluate((node) => {
        const rect = node.getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom };
      }),
      float.locator("img").evaluate((node) => {
        const rect = node.getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom };
      }),
    ]);

    // Ten sam luz nad i pod makietą — z dokładnością do pół piksela zaokrąglenia.
    expect(Math.abs(image.top - box.top - (box.bottom - image.bottom))).toBeLessThanOrEqual(1);
  });

  test("blok jest ilustracją: nie ma w nim nic klikalnego", async ({ page }) => {
    await page.goto("/");

    const section = page.locator(SECTION);
    await expect(section.locator("a, button, input, [tabindex]")).toHaveCount(0);
    await expect(section.locator("li.tile")).toHaveCount(4);
  });

  test("nagłówkiem sekcji jest zdanie, nie etykieta nad nim", async ({
    page,
  }) => {
    await page.goto("/");

    const heading = page.locator("#ad-placements-heading");
    await expect(heading).toHaveRole("heading");
    await expect(page.locator(`${SECTION} p.placements__eyebrow`)).toHaveText(
      "Formaty reklam Google Ads",
    );
  });
});
