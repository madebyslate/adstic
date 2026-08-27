# `<Nazwa>` — spec

> Kopiujesz ten plik na `<Nazwa>.spec.md` PRZED napisaniem schematu i komponentu
> (AGENT-RULES §3.2). Otwarte pytania zadajesz zanim zaczniesz kodować.

## Czym jest

Jedno–dwa zdania: co ten blok komunikuje i na których stronach występuje.

- Figma: `<link do node'a>`
- Warianty w Figmie: `<np. z CTA / bez CTA, jasny / ciemny>`

## Pola

Ta tabela jest źródłem schematu zod w `packages/shared/src/blocks/<Nazwa>.ts`.
Nazwy pól są takie, jak będą w Payloadzie — angielskie, camelCase, ludzkie.

| Pole | Typ | Wymagane | Uwagi |
|---|---|---|---|
| `blockType` | `'<nazwa>'` | tak | dyskryminator unii |
| `heading` | `string` | tak | |
| | | | |

## Breakpointy

Porównanie z Figmą w szerokościach 1440 / 768 / 390.

| Szerokość | Co się zmienia |
|---|---|
| ≥ 1440 | |
| 768–1439 | |
| < 768 | |

## Stany

Hover / active / focus / disabled — co dokładnie się dzieje i przez jaki token.

## Animacje

| Co | Kiedy | Czas | Easing | `prefers-reduced-motion: reduce` |
|---|---|---|---|---|
| | | | | |

Animujesz wyłącznie `transform` i `opacity` (AGENT-RULES §6).

## Budżet

| Pozycja | Budżet | Faktycznie |
|---|---|---|
| JS (skompresowany) | 0 KB | |
| Requesty | | |
| Największy zasób | | |

Każdy kilobajt JS wymaga uzasadnienia w tej sekcji.

## A11y

- Poziom nagłówka i `aria-labelledby` sekcji:
- Nawigacja klawiaturą:
- Kontrast (≥ 4.5:1 tekst, ≥ 3:1 UI):
- Źródło `alt`:

## Otwarte pytania

- [ ] …
