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
     * więc kwadrat wymuszony na sztywno deformowałby połowę z nich. Ikony idą
     * inline (patrz `ui/DotIcon.astro`), więc proporcję niesie viewBox, a nie
     * naturalne wymiary pliku.
     */
    await page.goto("/");
    await page.setViewportSize({ width: 1440, height: 900 });

    const icons = page.locator(`${SECTION} .why-item__icon`);
    const count = await icons.count();
    expect(count).toBe(4);

    for (let index = 0; index < count; index += 1) {
      const drawn = await icons.nth(index).evaluate((node: SVGSVGElement) => ({
        viewBox: node.getAttribute("viewBox"),
        rendered: node.getBoundingClientRect(),
      }));

      const [, , boxWidth, boxHeight] = drawn.viewBox!.split(/\s+/).map(Number);

      expect(drawn.rendered.width).toBeCloseTo(32, 0);
      // Wysokość WYNIKA z rysunku, nie z kwadratu wymuszonego w CSS.
      expect(drawn.rendered.height).toBeCloseTo((32 * boxHeight) / boxWidth, 0);
    }
  });

  test("ikony nie kosztują ani jednego requestu", async ({ page }) => {
    /*
     * Sedno zamiany `<img>` → inline (spec → „Ikony”): cztery pliki z Figmy to
     * 49 KB w czterech requestach. Gdyby ktoś wrócił do `<img src>`, kropki
     * przestałyby migotać BEZ ŻADNEGO objawu w teście wizualnym — snapshot
     * robi się przy `reduce`, czyli na klatce spoczynkowej, która wygląda
     * identycznie. Test pilnuje więc drugiej strony tej samej decyzji.
     */
    const vectors: string[] = [];
    page.on("request", (request) => {
      if (/why-choose\/.*\.svg/.test(request.url())) vectors.push(request.url());
    });

    await page.goto("/");
    await page.locator(SECTION).scrollIntoViewIfNeeded();
    await page.waitForLoadState("networkidle");

    expect(vectors, "ikona pojechała plikiem — kropki znów są pikselami").toEqual([]);
    // Kropki są elementami dokumentu, więc CSS ma do nich dostęp.
    expect(await page.locator(`${SECTION} .why-item__icon circle`).count()).toBeGreaterThan(200);
  });

  test("rysunek zachowuje trzy warstwy z eksportu, nie jedną siatkę", async ({ page }) => {
    /*
     * Plik z Figmy nie jest jedną siatką kropek w jednym kolorze: martwa siatka
     * tła (#242624) jest ostra, czerwona kopia KSZTAŁTU leży pod nią rozmyta,
     * a na wierzchu stoją te same pozycje w kolorze treści. Spłaszczenie tego
     * do jednej warstwy (albo rozmycie całości) psuje rysunek w sposób, którego
     * snapshot sekcji nie złapie — ikona ma 32 px, więc różnica ginie pod
     * tolerancją porównania.
     */
    await page.goto("/");
    await page.locator(SECTION).scrollIntoViewIfNeeded();

    const icon = page.locator(`${SECTION} .why-item__icon`).first();

    const layers = await icon.evaluate((svg: SVGSVGElement) => {
      const read = (selector: string) => {
        const group = svg.querySelector(selector)!;
        const style = getComputedStyle(group);
        return {
          dots: group.querySelectorAll("circle").length,
          fill: style.fill,
          blurred: style.filter !== "none",
        };
      };
      return {
        glow: read(".dot-icon__glow"),
        grid: read(".dot-icon__grid"),
        face: read(".dot-icon__face"),
      };
    });

    // Poświata i kształt to TE SAME pozycje — czerwień jest podkładem kropki.
    expect(layers.glow.dots).toBe(layers.face.dots);
    // Siatka tła jest liczniejsza od kształtu; gdyby było odwrotnie, parser
    // pomylił warstwy i rysunek byłby negatywem samego siebie.
    expect(layers.grid.dots).toBeGreaterThan(layers.face.dots);

    expect(layers.glow.fill, "poświata nie jest czerwienią marki").toBe("rgb(255, 0, 67)");
    expect(layers.face.fill, "kształt nie jest w kolorze treści").toBe("rgb(254, 255, 241)");
    /*
     * Kropki tła są malowane KOLOREM TREŚCI, nie szarością #242624 z eksportu:
     * głowa sopla ma być biała. Szarość z pliku jest wynikiem spoczynkowego
     * krycia, nie wartością — sprawdza to osobny test niżej.
     */
    expect(layers.grid.fill, "siatka tła zgubiła swój kolor").toBe("rgb(254, 255, 241)");

    // Rozmyta jest WYŁĄCZNIE poświata — reszta rysunku zostaje ostra.
    expect(layers.glow.blurred, "poświata przestała być rozmyta").toBe(true);
    expect(layers.grid.blurred, "siatka tła została rozmyta").toBe(false);
    expect(layers.face.blurred, "kształt został rozmyty").toBe(false);
  });

  test("kropka tła w spoczynku ma kolor z eksportu, mimo jaśniejszego fillu", async ({ page }) => {
    /*
     * Para `--dot-icon-grid` + `--dot-icon-grid-rest` jest policzona tak, żeby
     * złożyć się na tle strony (#0d0f0d) dokładnie w #242624 z pliku Figmy.
     * Zmiana jednej z nich bez drugiej przesuwa SPOCZYNKOWY wygląd wszystkich
     * czterech ikon — a że różnica jest o kilka jednostek na kanale, snapshot
     * sekcji przepuści ją pod tolerancją.
     */
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.locator(SECTION).scrollIntoViewIfNeeded();

    const composited = await page
      .locator(`${SECTION} .dot-icon__grid circle`)
      .first()
      .evaluate((dot) => {
        const alpha = Number(getComputedStyle(dot).opacity);
        const fill = getComputedStyle(dot.parentElement!).fill.match(/[\d.]+/g)!.map(Number);
        const page = [13, 15, 13]; // --color-bg, #0d0f0d
        return fill.map((channel, index) => Math.round(page[index]! + alpha * (channel - page[index]!)));
      });

    /* ±1 na kanale — pary krycia i koloru nie da się dobrać co do jednostki. */
    for (const [index, channel] of composited.entries()) {
      expect(Math.abs(channel - [36, 38, 36][index]!)).toBeLessThanOrEqual(1);
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
