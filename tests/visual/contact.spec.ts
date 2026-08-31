import { test, expect } from "./_motion-off";

const SECTION = "section:has(#contact-heading)";

test.describe("Blok Contact", () => {
  test("wygląda zgodnie z zaakceptowanym stanem", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);

    const section = page.locator(SECTION);
    await section.scrollIntoViewIfNeeded();
    // Kadr w tle idzie `lazy` — bez tego snapshot łapie sekcję bez łuny.
    await page.waitForLoadState("networkidle");

    await expect(section).toHaveScreenshot("contact.png");
  });

  test("aktywny kafel w pasie kroków pokazuje ikonę i podpis", async ({ page }) => {
    /*
     * Osobny, ciasny snapshot pasa — nie fragment zrzutu całej sekcji. Gradient
     * aktywnego kafla jest warstwą `::before`, więc potrafi przykryć własną
     * treść (PLAYBOOK P-059), a na zrzucie CAŁEJ sekcji dwa zgaszone napisy to
     * ułamek promila pikseli, czyli mniej niż tolerancja porównania. Tutaj
     * kadrem jest sam pas i każde przykrycie od razu wywraca test.
     */
    await page.goto("/");

    const section = page.locator(SECTION);
    await section.scrollIntoViewIfNeeded();
    await expect(section.locator(".contact__rail")).toHaveScreenshot("contact-rail-step-1.png");

    await section.locator("label.option").first().click();
    await section.locator("[data-next]").click();
    await expect(section.locator('[data-step-tab="1"]')).toHaveAttribute("aria-current", "step");
    await expect(section.locator(".contact__rail")).toHaveScreenshot("contact-rail-step-2.png");
  });

  test("kreator prowadzi przez trzy kroki i wraca", async ({ page }) => {
    await page.goto("/");

    const section = page.locator(SECTION);
    const panels = section.locator("[data-step]");
    await expect(panels).toHaveCount(3);
    await expect(panels.nth(0)).toBeVisible();
    await expect(panels.nth(1)).toBeHidden();

    // Bez wyboru celu krok się nie zmienia — pokazuje się komunikat.
    await section.locator("[data-next]").click();
    await expect(page.locator("#contact-goals-error")).toBeVisible();
    await expect(panels.nth(0)).toBeVisible();

    await section.locator("label.option").first().click();
    await section.locator("[data-next]").click();
    await expect(page.locator("#contact-goals-error")).toBeHidden();
    await expect(panels.nth(1)).toBeVisible();

    // Powrót działa i odwiedzony krok da się kliknąć w pasie.
    await section.locator("[data-back]").click();
    await expect(panels.nth(0)).toBeVisible();
    await section.locator('[data-step-tab="1"]').click();
    await expect(panels.nth(1)).toBeVisible();
  });

  test("krok 3 streszcza to, co zostało zaznaczone i wpisane", async ({ page }) => {
    await page.goto("/");

    const section = page.locator(SECTION);
    const option = section.locator("label.option").first();
    const chosen = (await option.locator(".option__label").textContent())?.trim();

    await option.click();
    await section.locator("[data-next]").click();
    await section.locator('input[name="name"]').fill("Jan");
    await section.locator('input[name="phone"]').fill("600100200");
    await section.locator('input[name="email"]').fill("jan@example.com");
    await section.locator("[data-next]").click();

    await expect(section.locator("[data-summary-goals]")).toHaveText(chosen!);
    await expect(section.locator("[data-summary-details]")).toContainText("Jan");
    await expect(section.locator("[data-summary-details]")).toContainText("jan@example.com");
  });

  test("etykieta pola płynie w górę i nie zmienia wysokości pudełka", async ({ page }) => {
    await page.goto("/");

    const section = page.locator(SECTION);
    await section.locator("label.option").first().click();
    await section.locator("[data-next]").click();

    const field = section.locator("label.field").first();
    const input = field.locator("input");
    const label = field.locator(".field__label");

    const height = () => field.evaluate((node) => node.getBoundingClientRect().height);
    const idleHeight = await height();

    // Stan spoczynku: etykieta stoi w naturalnej skali, na środku pola.
    await expect(label).toHaveCSS("scale", "none");

    await input.click();
    // Ruch idzie przez `translate`/`scale`, nie `font-size` — patrz spec → „Animacje".
    await expect(label).not.toHaveCSS("scale", "none");

    // Etykieta zostaje u góry po odejściu fokusa, bo pole ma treść.
    await input.fill("Jan");
    await section.locator("[data-back]").click();
    await section.locator('[data-step-tab="1"]').click();
    await expect(label).not.toHaveCSS("scale", "none");

    // Pudełko nie urosło ani nie zmalało — kliknięcie w pole nie przesuwa strony.
    expect(await height()).toBe(idleHeight);
  });

  test("adres strony przechodzi bez protokołu i bez wypełnienia", async ({ page }) => {
    /*
     * `type="url"` odrzucało `invette.dev` — a dokładnie tak ludzie podają
     * adres. Pole jest pomocnicze i nieobowiązkowe, więc walidacja formatu
     * kosztowała wyłącznie porzucone zgłoszenia. Patrz spec → „Stany".
     */
    await page.goto("/");

    const section = page.locator(SECTION);
    await section.locator("label.option").first().click();
    await section.locator("[data-next]").click();

    const website = section.locator('input[name="website"]');
    await expect(website).not.toHaveAttribute("required", /.*/);

    await website.fill("invette.dev");
    expect(await website.evaluate((input: HTMLInputElement) => input.checkValidity())).toBe(true);

    // Puste pole też nie może zatrzymać kroku.
    await website.fill("");
    await section.locator('input[name="name"]').fill("Jan");
    await section.locator('input[name="phone"]').fill("600100200");
    await section.locator('input[name="email"]').fill("jan@example.com");
    await section.locator("[data-next]").click();
    await expect(section.locator('[data-step="2"]')).toBeVisible();
  });

  test("kwadracik zgody stoi w osi pierwszego wiersza tekstu", async ({ page }) => {
    /*
     * `align-items: start` na wierszu zgody (zgoda łamie się na dwa wiersze na
     * wąskim ekranie) stawia kwadrat przy górnej krawędzi wiersza, nie w jego
     * osi. Różnica to ~2 px — dokładnie tyle, ile widać jako „krzywy checkbox".
     */
    await page.goto("/");

    const section = page.locator(SECTION);
    await section.locator("label.option").first().click();
    await section.locator("[data-next]").click();
    await section.locator('input[name="name"]').fill("Jan");
    await section.locator('input[name="phone"]').fill("600100200");
    await section.locator('input[name="email"]').fill("jan@example.com");
    await section.locator("[data-next]").click();

    const offset = await section.locator("label.consent").evaluate((label) => {
      const box = label.querySelector(".option__box")!.getBoundingClientRect();
      const text = label.querySelector(".consent__label")!;
      /*
       * Oś PIERWSZEGO wiersza, nie środek pudełka etykiety: poniżej 768 px
       * zgoda łamie się na dwa wiersze i środek pudełka leży wtedy 20 px niżej.
       * Etykieta jest elementem flex, więc `getClientRects()` zwraca jeden
       * prostokąt na całość — wiersz trzeba policzyć z `line-height`.
       */
      const line = Number.parseFloat(getComputedStyle(text).lineHeight);
      return box.top + box.height / 2 - (text.getBoundingClientRect().top + line / 2);
    });

    expect(Math.abs(offset), `kwadrat rozjechał się o ${offset} px`).toBeLessThanOrEqual(1);
  });

  test("bez JS wszystkie kroki są widoczne, a pas kroków nie udaje nawigacji", async ({
    browser,
  }) => {
    /*
     * Kontrakt progressive enhancement (spec → „Budżet"): awaria skryptu ma
     * zabrać wygodę, nie funkcję. Bez JS formularz jest jedną listą pól,
     * a przyciski kroków zostają `disabled`.
     */
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/");

    const section = page.locator(SECTION);
    for (let index = 0; index < 3; index += 1) {
      await expect(section.locator(`[data-step="${index}"]`)).toBeVisible();
    }
    await expect(section.locator("[data-step-tab]").first()).toBeDisabled();
    // „Dalej" i „Wstecz" bez JS nie mają czego robić — nie ma ich na ekranie.
    await expect(section.locator("[data-next]")).toBeHidden();
    await expect(section.locator("[data-back]")).toBeHidden();

    await context.close();
  });

  test("wysyłka jest wyłączona, dopóki `action` jest puste", async ({ page }) => {
    await page.goto("/");

    const section = page.locator(SECTION);
    // Etap 1 nie ma endpointów (AGENT-RULES §1) — patrz spec → „Otwarte pytania".
    await expect(section.locator("form")).not.toHaveAttribute("action", /.+/);
    await expect(section.locator("[data-submit]")).toBeDisabled();
  });

  test("łuna płyty miesza się z kadrem sekcji, nie ze stroną", async ({ page }) => {
    await page.goto("/");

    /*
     * `mix-blend-mode` bez grupy izolującej zlewa się z całą stroną (P-037).
     * Ten test pilnuje obu połówek warunku naraz.
     */
    const section = page.locator(SECTION);
    await expect(section).toHaveCSS("isolation", "isolate");
    await expect(section.locator(".contact__glow")).toHaveCSS("mix-blend-mode", "plus-lighter");
  });

  test("nagłówkiem sekcji jest zdanie, nie etykieta nad nim", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("#contact-heading")).toHaveRole("heading");
    await expect(page.locator(`${SECTION} p.contact__eyebrow`)).toHaveText("Kontakt");
  });
});
