# Adstic — instrukcja dla agentów

Ten plik czytasz na starcie każdej sesji, razem z `AGENT-RULES-STAGE-1.md`.
W razie konfliktu wygrywa `AGENT-RULES-STAGE-1.md`.

## Zanim dotkniesz kodu

1. Przeczytaj `DECISIONS.md`, `BLOCKS.md` i `PLAYBOOK.md`.
2. Dla bloku, nad którym pracujesz — przeczytaj jego `.spec.md`.
   Jeśli nie istnieje, utwórz go z `_TEMPLATE.spec.md` i wypełnij PRZED kodowaniem.
3. Zaplanuj w 3–6 punktach.

## Granice etapu 1

- Astro zostaje statyczne. Zero SSR, zero endpointów API.
- **Nie** dodajesz kolekcji treściowych w `apps/cms` — model treści powstaje
  z zakodowanych bloków, nie odwrotnie.
- **Nie** definiujesz typów danych poza `packages/shared`.
- **Nie** hardkodujesz kolorów, px ani cieni w komponentach — wyłącznie tokeny.
- **Nie** instalujesz zależności bez jednozdaniowego uzasadnienia.

## Gdzie co należy

| Chcesz zmienić | Miejsce |
|---|---|
| kształt danych | `packages/shared/src/` |
| wartość wizualną | `packages/tokens/tokens.css` |
| treść | `content/pages/*.json` |
| skąd biorą się dane | `apps/web/src/lib/content/` |
| co widzi użytkownik | `apps/web/src/components/` |
| model CMS (etap 2) | `apps/cms/src/collections/` + migracja |
| wdrożenie | `Dockerfile`, `docker-compose.yml`, `docker/` |

## Weryfikacja przed zgłoszeniem gotowości

```sh
pnpm verify          # typecheck + lint + build
pnpm test:visual     # snapshoty
pnpm lighthouse      # budżety perf
```

Raportujesz faktyczne liczby, nie „powinno być ok". Odstępstwa od Figmy
wymieniasz z powodem. Każdą decyzję niestandardową dopisujesz do `DECISIONS.md`.

## Czego pilnuje deploy

Klasa zmian, które psują wdrożenie i nie widać ich lokalnie, jest opisana
w `PLAYBOOK.md` §2 — z objawem, przyczyną i tym, co ją wyłapuje. Przed każdą
zmianą dotykającą `Dockerfile`, `docker/`, `astro.config.mjs`, `next.config.ts`
albo kolekcji Payloada czytasz tamtą listę. Weryfikujesz `docker build`, nie
`pnpm build` — połowa tych błędów jest lokalnie niewidoczna z definicji.

## Notatnik workflow

Adstic jest pilotem, na którym powstaje starter Astro + Payload. `PLAYBOOK.md`
jest produktem tego pilota na równi z kodem — utrzymujesz go, nie tylko czytasz.

Dopisujesz **w tym samym commicie**, w którym problem został rozwiązany, gdy:

- straciłeś > 15 min na coś, czego nie widać w kodzie,
- coś działa lokalnie i pada w kontenerze (albo odwrotnie) — zawsze, bez progu czasu,
- dodałeś plik lub konfig, którego brak wywróciłby projekt,
- pomyślałeś „następnym razem inaczej", ale nie zmieniasz tego teraz.

Granica względem `DECISIONS.md`: podmień w zdaniu „Adstic" na inną nazwę.
Traci sens → `DECISIONS.md`. Nie traci → `PLAYBOOK.md`.

Jeśli zamiast wpisu da się napisać test — piszesz test i wymieniasz go w polu
`Wyłapuje`. Automat jest lepszym nośnikiem wiedzy niż proza.
