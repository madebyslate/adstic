import { test, expect } from "./_motion-off";

const SECTION = "section:has(#how-we-work-heading)";

test.describe("Blok HowWeWork", () => {
  test("wygląda zgodnie z zaakceptowanym stanem", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);

    const section = page.locator(SECTION);
    await section.scrollIntoViewIfNeeded();

    await expect(section).toHaveScreenshot("how-we-work.png");
  });

  test("tytuły kroków stoją na jednej wysokości", async ({ page }) => {
    test.skip(
      (page.viewportSize()?.width ?? 0) < 1024,
      "Poniżej 1024 px kroki stoją jeden pod drugim — wspólna wysokość tytułów nie ma sensu.",
    );

    /*
     * To jest wymaganie z makiety, a nie efekt uboczny układu: tytuł łamiący
     * się na dwa wiersze nie ma prawa zepchnąć siebie ani sąsiadów. Trzyma to
     * stały odstęp od numeru (`--step-title-offset`), więc gdyby ktoś zamienił
     * go na wyrównanie pionowe, ten test padnie.
     */
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);

    const tops = await page
      .locator(`${SECTION} .step__title`)
      .evaluateAll((nodes) =>
        nodes.map((node) => Math.round(node.getBoundingClientRect().top)),
      );

    expect(tops).toHaveLength(4);
    expect(new Set(tops).size).toBe(1);
  });

  test("pas czyta się jak jeden kształt: promienie zależą od pozycji", async ({
    page,
  }) => {
    test.skip(
      (page.viewportSize()?.width ?? 0) < 1024,
      "Ten układ promieni dotyczy pasa poziomego; wariant pionowy niżej.",
    );
    await page.goto("/");

    const steps = page.locator(`${SECTION} .step`);
    // Pierwszy kafel zaokrąglony od lewej, ostatni od prawej, środkowe wcale.
    await expect(steps.nth(0)).toHaveCSS("border-top-left-radius", "24px");
    await expect(steps.nth(0)).toHaveCSS("border-top-right-radius", "6px");
    await expect(steps.nth(1)).toHaveCSS("border-top-left-radius", "6px");
    await expect(steps.nth(3)).toHaveCSS("border-top-right-radius", "24px");
    await expect(steps.nth(3)).toHaveCSS("border-bottom-left-radius", "6px");

    await expect(page.locator(`${SECTION} .steps__rail`)).toHaveCSS(
      "background-color",
      "rgb(10, 12, 10)",
    );
  });

  test("pas pionowy zaokrągla górę i dół, nie boki", async ({ page }) => {
    test.skip(
      (page.viewportSize()?.width ?? 0) >= 1024,
      "Wariant jednokolumnowy — poniżej 768 px.",
    );
    await page.goto("/");

    const steps = page.locator(`${SECTION} .step`);
    await expect(steps.nth(0)).toHaveCSS("border-top-left-radius", "24px");
    await expect(steps.nth(0)).toHaveCSS("border-top-right-radius", "24px");
    await expect(steps.nth(0)).toHaveCSS("border-bottom-left-radius", "6px");
    await expect(steps.nth(3)).toHaveCSS("border-bottom-right-radius", "24px");
  });

  test("kolejność kroków jest treścią, numer nie dubluje się w czytniku", async ({
    page,
  }) => {
    await page.goto("/");

    const section = page.locator(SECTION);
    await expect(section.locator("ol.steps__rail")).toBeVisible();
    await expect(section.locator("li.step")).toHaveCount(4);

    // Widoczne „/01” jest ozdobnikiem — listę numeruje sam <ol>.
    await expect(section.locator(".step__number").first()).toHaveText("/01");
    await expect(section.locator(".step__number").first()).toHaveAttribute(
      "aria-hidden",
      "true",
    );

    // Strzałka stoi MIĘDZY kaflami: trzy na cztery kroki, poza a11y.
    await expect(section.locator(".step__arrow")).toHaveCount(3);
    await expect(section.locator(".step__arrow").first()).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  test("nagłówkiem sekcji jest zdanie, nie etykieta nad nim", async ({
    page,
  }) => {
    await page.goto("/");

    const heading = page.locator("#how-we-work-heading");
    await expect(heading).toHaveRole("heading");
    await expect(page.locator(`${SECTION} p.steps__eyebrow`)).toHaveText(
      "Jak pracujemy",
    );
  });
});
