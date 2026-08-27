# Adstic

Monorepo: statyczny front Astro + Payload CMS, wdrażane w xCloud.

```
adstic-astro/
├── apps/
│   ├── web/              Astro, output: 'static'
│   └── cms/              Payload 3 (Next) — prywatna usługa Node
├── packages/
│   ├── shared/           schematy zod — JEDYNE źródło kształtu danych
│   └── tokens/           design tokeny (@theme Tailwind v4)
├── content/              fixtures etapu 1 (pages/*.json + media/)
├── docker/               nginx.conf, proxy_params, entrypoint, website-build.sh
├── tests/visual/         snapshoty Playwright
└── scripts/              encode-video.sh
```

Dokumenty, które czytasz przed pracą:

| Plik | Co zawiera |
|---|---|
| `AGENT-RULES-STAGE-1.md` (poza repo) | kontrakt pracy na etapie 1 |
| `DECISIONS.md` | log decyzji architektonicznych |
| `BLOCKS.md` | stan bloków i budżety |
| `DEPLOYMENT.md` | wdrożenie xCloud, migracje, backup |
| `content/README.md` | zasady fixtures |

## Wymagania

- Node `>= 22.12.0` (rozwijane na 22.22.2)
- pnpm `11.22.0` (`corepack enable`)
- Docker — tylko do lokalnej bazy i weryfikacji obrazów

## Start

```sh
pnpm install
cp .env.example .env          # wystarczy PUBLIC_SITE_URL i CONTENT_SOURCE=fixtures
pnpm dev                      # http://localhost:4321
```

CMS uruchamiasz osobno i tylko wtedy, gdy pracujesz nad etapem 2:

```sh
docker compose -f docker-compose.dev.yml up -d    # PostgreSQL na :5433
pnpm dev:cms                                       # http://localhost:3000/admin
```

## Komendy

| Komenda | Co robi |
|---|---|
| `pnpm dev` | Astro dev server |
| `pnpm dev:cms` | Payload / Next dev server |
| `pnpm build` | build obu aplikacji przez Turborepo |
| `pnpm typecheck` | `astro check` + `tsc --noEmit` we wszystkich pakietach |
| `pnpm verify` | typecheck + lint + build — uruchamiasz przed zgłoszeniem gotowości |
| `pnpm test:visual` | snapshoty Playwright na zbudowanej stronie |
| `pnpm lighthouse` | budżety perf z `lighthouserc.json` |
| `pnpm generate:types` | typy Payloada → `apps/cms/src/payload-types.ts` |
| `pnpm seed` | jednorazowy seed CMS-a |

## Kontrakt danych

Sekcja strony = **blok**. Blok to para:

- schemat zod w `packages/shared/src/blocks/<Nazwa>.ts`,
- komponent w `apps/web/src/components/blocks/<Nazwa>.astro` + `.spec.md`.

Komponenty przyjmują **wyłącznie** typy z `@repo/shared`. Żadnych własnych
interfejsów, żadnego `any`.

Dodanie bloku:

1. `cp apps/web/src/components/blocks/_TEMPLATE.spec.md .../<Nazwa>.spec.md`
   i wypełnij **przed** kodowaniem;
2. schemat w `packages/shared/src/blocks/<Nazwa>.ts` + wpis w `blocks/index.ts`;
3. fixture w `content/pages/<slug>.json`;
4. komponent + wpis w `apps/web/src/components/blocks/BlockRenderer.astro`;
5. porównanie z Figmą, snapshot Playwright, Lighthouse;
6. aktualizacja `BLOCKS.md`.

## Skąd biorą się dane

```
CONTENT_SOURCE=fixtures  →  content/pages/*.json          (etap 1)
CONTENT_SOURCE=payload   →  Payload REST API przy buildzie (etap 2)
```

Oba przechodzą przez ten sam schemat `Page` i to samo API
`apps/web/src/lib/content/`. Przełączenie źródła nie dotyka komponentów.

## Wdrożenie

Patrz `DEPLOYMENT.md`. W skrócie: publiczny jest wyłącznie Nginx, Payload żyje
w prywatnej sieci, statyczne Astro jest publikowane atomowo przez podmianę
symlinka, a media leżą w trwałym named volume.
