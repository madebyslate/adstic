import { test, expect } from "./_motion-off";

const SECTION = "section:has(#why-choose-heading)";
/* #232423 — `--color-border-hairline`, ta sama kreska co w tle WhoWeAre. */
const HAIRLINE = "rgb(35, 36, 35)";

test.describe("Blok WhyChooseUs", () => {
  test("wygląda zgodnie z zaakceptowanym stanem", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);

    const section = page.locator(SECTION);
    await section.scrollIntoViewIfNeeded();
    // Ikony idą `lazy` — bez tego snapshot łapie argumenty bez rysunków.
    await page.waitForLoadState("networkidle");

    await expect(section).toHaveScreenshot("why-choose-us.png");
  });

  test("kreski stykają się: pionowa jest krawędzią kolumny, poziome zaczynają się na niej", async ({
    page,
  }) => {
    /*
     * Sedno bloku (spec → „Siatka i kreski”): kreski nie są elementami, tylko
     * obrysami pudełek. Ten test pilnuje, że pionowa naprawdę jest lewą
     * krawędzią prawej kolumny — gdyby ktoś narysował ją tłem albo osobnym
     * `<span>`, poziome kreski przestałyby się z nią stykać przy pierwszej
     * zmianie siatki, a snapshot złapałby to dopiero jako różnicę pikseli.
     */
    await page.goto("/");
    await page.setViewportSize({ width: 1440, height: 900 });

    const grid = page.locator(`${SECTION} .why__grid`);
    const list = page.locator(`${SECTION} .why__list`);

    await expect(grid).toHaveCSS("border-top-color", HAIRLINE);
    await expect(grid).toHaveCSS("border-bottom-color", HAIRLINE);
    await expect(list).toHaveCSS("border-left-color", HAIRLINE);

    const gridBox = (await grid.boundingBox())!;
    const listBox = (await list.boundingBox())!;

    // Pionowa kreska stoi na środku sekcji…
    expect(Math.abs(listBox.x - (gridBox.x + gridBox.width / 2))).toBeLessThanOrEqual(1);
    // …a kolumna kończy się dokładnie na prawej krawędzi tabeli.
    expect(Math.abs(listBox.x + listBox.width - (gridBox.x + gridBox.width))).toBeLessThanOrEqual(1);
  });

  test("pierwszy argument nie dokłada kreski do górnej krawędzi tabeli", async ({ page }) => {
    // Dwie kreski w tym samym miejscu dałyby 2 px zamiast 1 px.
    await page.goto("/");
    await page.setViewportSize({ width: 1440, height: 900 });

    const items = page.locator(`${SECTION} .why-item`);
    await expect(items.first()).toHaveCSS("border-top-width", "0px");

    const rest = await items.count();
    for (let index = 1; index < rest; index += 1) {
      await expect(items.nth(index)).toHaveCSS("border-top-width", "1px");
      await expect(items.nth(index)).toHaveCSS("border-top-color", HAIRLINE);
    }
  });

  test("każda ikona ma 32 px szerokości, wysokość zostaje własna", async ({ page }) => {
    /*
     * Rysunki mają różną liczbę kropek w pionie (dwa pliki 32 × 32, dwa 29 × 29),
     * więc kwadrat wymuszony na sztywno deformowałby połowę z nich.
     */
    await page.goto("/");
    await page.setViewportSize({ width: 1440, height: 900 });

    const icons = page.locator(`${SECTION} .why-item__icon`);
    // Ikony idą `lazy` — dopóki blok jest pod foldem, plik nie jest wczytany
    // i przeglądarka nie zna jeszcze naturalnych wymiarów rysunku.
    await page.locator(SECTION).scrollIntoViewIfNeeded();
    await page.waitForLoadState("networkidle");

    const count = await icons.count();
    expect(count).toBeGreaterThan(0);

    for (let index = 0; index < count; index += 1) {
      const icon = icons.nth(index);
      const drawn = await icon.evaluate((node: HTMLImageElement) => ({
        natural: { width: node.naturalWidth, height: node.naturalHeight },
        rendered: node.getBoundingClientRect(),
      }));

      expect(drawn.natural.width).toBeGreaterThan(0);
      expect(drawn.rendered.width).toBeCloseTo(32, 0);
      // Wysokość WYNIKA z pliku, nie z kwadratu wymuszonego w CSS.
      expect(drawn.rendered.height).toBeCloseTo(
        (32 * drawn.natural.height) / drawn.natural.width,
        0,
      );
    }
  });

  test("przycisk jest dosunięty do dolnej kreski, nie odsunięty od akapitu", async ({ page }) => {
    /*
     * Odstęp nad przyciskiem jest nadwyżką wysokości, którą lewej kolumnie
     * narzuca lista argumentów — stała wartość rozjechałaby się przy zmianie
     * liczby argumentów. Sprawdzalne jest to, co z tego wynika: przycisk stoi
     * tyle samo od dolnej kreski, ile etykieta od górnej.
     */
    await page.goto("/");
    await page.setViewportSize({ width: 1440, height: 900 });

    const grid = page.locator(`${SECTION} .why__grid`);
    const eyebrow = page.locator(`${SECTION} .why__eyebrow`);
    const button = page.locator(`${SECTION} .why__button`);

    const gridBox = (await grid.boundingBox())!;
    const eyebrowBox = (await eyebrow.boundingBox())!;
    const buttonBox = (await button.boundingBox())!;

    const topGap = eyebrowBox.y - gridBox.y;
    const bottomGap = gridBox.y + gridBox.height - (buttonBox.y + buttonBox.height);
    expect(Math.abs(topGap - bottomGap)).toBeLessThanOrEqual(2);
  });

  test("nagłówkiem sekcji jest zdanie, nie etykieta nad nim", async ({ page }) => {
    await page.goto("/");

    const heading = page.locator(`${SECTION} h2#why-choose-heading`);
    await expect(heading).toHaveText("The difference we deliver");

    // Argumenty są listą, a ich tytuły stoją poziom niżej niż nagłówek sekcji.
    await expect(page.locator(`${SECTION} ul.why__list > li`)).toHaveCount(4);
    await expect(page.locator(`${SECTION} .why-item h3`)).toHaveCount(4);
  });

  test("blok ma dokładnie jeden przystanek klawiatury", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.locator(`${SECTION} a, ${SECTION} button, ${SECTION} [tabindex]:not([tabindex="-1"])`),
    ).toHaveCount(1);
  });

  test("poniżej 768 px podział obraca się o 90°", async ({ page }) => {
    await page.goto("/");
    await page.setViewportSize({ width: 390, height: 844 });

    const list = page.locator(`${SECTION} .why__list`);
    await expect(list).toHaveCSS("border-left-width", "0px");
    await expect(list).toHaveCSS("border-top-width", "1px");
    await expect(list).toHaveCSS("border-top-color", HAIRLINE);
  });
});
