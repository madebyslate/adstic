import { test, expect } from "./_motion-off";

const SECTION = "section:has(#cta-heading)";

test.describe("Blok Cta", () => {
  test("wygląda zgodnie z zaakceptowanym stanem", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);

    const section = page.locator(SECTION);
    await section.scrollIntoViewIfNeeded();
    // Kadr w tle idzie `lazy` — bez tego snapshot łapie płytę bez łuny.
    await page.waitForLoadState("networkidle");

    await expect(section).toHaveScreenshot("cta.png");
  });

  test("światło płyty leży NAD kadrem, nie pod nim", async ({ page }) => {
    /*
     * Cień `inset` przeniesiony z makiety wprost na płytę malowałby się pod
     * jej dzieckiem z obrazem i po prostu by go nie było widać (spec → „Trzy
     * warstwy płyty”). Ten test pilnuje, że światło zostało nakładką: sama
     * płyta ma wyłącznie cień rzucony, `::after` — wyłącznie `inset`.
     */
    await page.goto("/");

    const panel = page.locator(`${SECTION} .cta__panel`);
    const shadow = await panel.evaluate((node) => getComputedStyle(node).boxShadow);
    expect(shadow).not.toContain("inset");

    const overlay = await panel.evaluate(
      (node) => getComputedStyle(node, "::after").boxShadow,
    );
    expect(overlay).toContain("inset");
  });

  test("łuna nie jest obrazem i nie wypycha strony w poziom", async ({ page }) => {
    await page.goto("/");

    const glow = page.locator(`${SECTION} .cta__glow`);
    await expect(glow).toHaveAttribute("aria-hidden", "true");
    // Plama jest kształtem CSS (P-037): kolor + filtr, zero requestów.
    await expect(glow).toHaveCSS("background-color", "rgb(39, 40, 39)");
    await expect(glow).toHaveCSS("filter", "blur(90px)");
    await expect(glow.locator("img")).toHaveCount(0);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("nagłówkiem sekcji jest zdanie, nie etykieta nad nim", async ({ page }) => {
    await page.goto("/");

    const heading = page.locator("#cta-heading");
    await expect(heading).toHaveRole("heading");
    await expect(page.locator(`${SECTION} p.cta__eyebrow`)).toHaveText("Let's talk");
  });

  test("korzyści są listą, ptaszki zostają poza czytnikiem", async ({ page }) => {
    await page.goto("/");

    const section = page.locator(SECTION);
    const list = section.locator("ul.cta__benefits");
    await expect(list).toHaveAttribute("aria-labelledby", "cta-benefits-heading");
    await expect(list.locator("li.benefit")).toHaveCount(3);
    await expect(section.locator(".benefit__icon").first()).toHaveAttribute(
      "aria-hidden",
      "true",
    );

    // Jedyny element focusowalny w bloku to przycisk.
    await expect(section.locator("a")).toHaveCount(1);
  });
});
