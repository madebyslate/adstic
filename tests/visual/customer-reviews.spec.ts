import { test, expect } from "./_motion-off";

const SECTION = "section:has(#customer-reviews-heading)";

/*
 * PUŁAPKA (PLAYBOOK P-045): `animations: 'disabled'` z konfiguracji ANULUJE
 * animacje nieskończone i przy pasie jadącym w drugą stronę zapisuje kadr,
 * w którym środkowa kolumna jest pusta — w przeglądarce renderuje się
 * poprawnie. Zamrażamy pas sami: pauza na pierwszej klatce daje ten sam kadr
 * przy każdym uruchomieniu i pokazuje to, co widzi użytkownik.
 */
async function freezeMarquee(page: import("@playwright/test").Page) {
  await page.evaluate(() => {
    document.querySelectorAll(".reviews__track").forEach((track) => {
      track.getAnimations().forEach((animation) => {
        animation.pause();
        animation.currentTime = 0;
      });
    });
  });
}

test.describe("Blok CustomerReviews", () => {
  test("wygląda zgodnie z zaakceptowanym stanem", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);

    const section = page.locator(SECTION);
    await section.scrollIntoViewIfNeeded();
    // Kadr i logotypy idą `lazy` — bez tego snapshot łapie ścianę bez obrazów.
    await page.waitForLoadState("networkidle");
    await freezeMarquee(page);

    /*
      `animations: 'allow'` NIE znaczy „rób zdjęcie w ruchu" — pas jest już
      zatrzymany przez `freezeMarquee()`. Znaczy „nie anuluj animacji przy
      zrzucie", bo to anulowanie jest właśnie tym, co gubi środkową kolumnę.
    */
    await expect(section).toHaveScreenshot("customer-reviews.png", { animations: "allow" });
  });

  test("pętla pasa domyka się: przesuw to wysokość jednej kopii RAZEM z odstępem", async ({
    page,
  }) => {
    /*
     * Sedno marquee (spec → „Animacje”): klatka końcowa musi być pikselowo
     * tożsama z początkową. Przesuw o `100% / kopie` byłby o `gap / kopie`
     * za krótki — na oko to powolny dryf, którego snapshot nie złapie, bo
     * łapie tylko klatkę początkową.
     */
    await page.goto("/");
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator(SECTION).scrollIntoViewIfNeeded();

    const tracks = page.locator(`${SECTION} .reviews__track`);
    const count = await tracks.count();
    expect(count).toBe(3);

    for (let index = 0; index < count; index += 1) {
      const loop = await tracks.nth(index).evaluate((track) => {
        const styles = getComputedStyle(track);
        const copies = Number(styles.getPropertyValue("--marquee-copies"));
        const cardsPerCopy = Number(styles.getPropertyValue("--marquee-cards"));
        const gap = Number.parseFloat(styles.rowGap);
        const cards = track.querySelectorAll<HTMLElement>(":scope > li");

        return {
          // O tyle przesuwa się tor w jednym cyklu…
          shift: (track.getBoundingClientRect().height + gap) / copies,
          // …a o tyle musi, żeby kopia 2 stanęła dokładnie tam, gdzie stała 1.
          copyHeight:
            cards[cardsPerCopy]!.getBoundingClientRect().top -
            cards[0]!.getBoundingClientRect().top,
        };
      });

      expect(Math.abs(loop.shift - loop.copyHeight)).toBeLessThanOrEqual(1);
    }
  });

  test("środkowa kolumna jedzie w przeciwną stronę niż skrajne", async ({ page }) => {
    await page.goto("/");
    await page.setViewportSize({ width: 1440, height: 900 });

    const tracks = page.locator(`${SECTION} .reviews__track`);
    await expect(tracks.nth(0)).toHaveCSS("animation-direction", "normal");
    await expect(tracks.nth(1)).toHaveCSS("animation-direction", "reverse");
    await expect(tracks.nth(2)).toHaveCSS("animation-direction", "normal");
  });

  test("kursor zatrzymuje tylko tę kolumnę, na której stoi", async ({ page }) => {
    /*
     * WCAG 2.2.2: ruch trwający dłużej niż 5 s musi dać się zatrzymać, a tutaj
     * ruch niesie tekst. Czyta się jedną opinię, nie trzy naraz — zatrzymanie
     * całej ściany wyglądałoby jak zacięcie sekcji.
     *
     * Jedyny test w tym pliku, który potrzebuje ruchu WŁĄCZONEGO: pyta
     * o `animation-play-state`, a globalna reguła redukcji ruchu wymusza na tej
     * własności `running !important` (żeby nic nie zostało na klatce startowej).
     * Pod redukcją pytanie „czy hover zatrzymuje" nie ma więc sensu — i tak nie
     * ma czego zatrzymywać, bo pas jest statyczny.
     */
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await page.setViewportSize({ width: 1440, height: 900 });

    const wall = page.locator(`${SECTION} .reviews__wall`);
    await wall.scrollIntoViewIfNeeded();

    const tracks = page.locator(`${SECTION} .reviews__track`);
    /*
      Kursor stawiamy myszą po współrzędnych, a nie `hover()` na torze:
      `hover()` czeka, aż element się USTABILIZUJE, a tor jedzie w pętli bez
      końca — czekanie kończy się timeoutem testu, nie najechaniem.
    */
    const box = (await tracks.nth(1).boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, (await wall.boundingBox())!.y + 20);

    await expect(tracks.nth(1)).toHaveCSS("animation-play-state", "paused");
    await expect(tracks.nth(0)).toHaveCSS("animation-play-state", "running");
    await expect(tracks.nth(2)).toHaveCSS("animation-play-state", "running");
  });

  test("czytnik ekranu dostaje każdą opinię raz, mimo kopii w torach", async ({ page }) => {
    await page.goto("/");

    // Tory są duplikatem i jadą w pętli — jako całość stoją poza drzewem a11y.
    const tracks = page.locator(`${SECTION} .reviews__track`);
    const count = await tracks.count();
    for (let index = 0; index < count; index += 1) {
      await expect(tracks.nth(index)).toHaveAttribute("aria-hidden", "true");
    }

    // Lista dla czytnika ma dokładnie tyle pozycji, ile opinii jest w danych.
    await expect(page.locator(`${SECTION} ul.sr-only > li`)).toHaveCount(6);
    // …i ani jednego przystanku klawiatury: w bloku nie ma nic interaktywnego.
    await expect(
      page.locator(`${SECTION} a, ${SECTION} button, ${SECTION} [tabindex]:not([tabindex="-1"])`),
    ).toHaveCount(0);
  });

  test("liczba gwiazdek wynika z oceny w danych, nie z CSS", async ({ page }) => {
    await page.goto("/");

    const stars = page.locator(`${SECTION} .reviews__track > li`).first().locator(".review__star");
    await expect(stars).toHaveCount(5);
    // Pomarańcz gwiazdek to NIE czerwień kreski przy nazwisku (#ff0043).
    await expect(stars.first()).toHaveCSS("fill", "rgb(238, 136, 52)");
  });

  test("poniżej 768 px ściana jest listą: bez ruchu i bez duplikatów", async ({ page }) => {
    /*
     * Trzy tory jeden pod drugim w jednej kolumnie znaczyłyby, że w oknie
     * o stałej wysokości widać wyłącznie pierwszy — dwie trzecie opinii nie
     * pokazałyby się na telefonie nigdy.
     */
    await page.goto("/");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator(SECTION).scrollIntoViewIfNeeded();

    const wall = page.locator(`${SECTION} .reviews__wall`);
    await expect(wall).toHaveCSS("overflow-y", "visible");
    await expect(page.locator(`${SECTION} .reviews__track`).first()).toHaveCSS(
      "animation-name",
      "none",
    );

    // Widocznych boxów jest dokładnie tyle, ile opinii — kopie są wyłączone.
    await expect(page.locator(`${SECTION} .reviews__track > li:visible`)).toHaveCount(6);
  });
});
