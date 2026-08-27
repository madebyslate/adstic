# DEPLOYMENT — Adstic

Konkretne wartości dla tego projektu. Standard ogólny:
`XCLOUD_ASTRO_PAYLOAD_DEPLOYMENT_STANDARD.md`.

---

## 1. Architektura wdrożenia

```
Użytkownik → HTTPS domeny → router (Nginx, jedyny publiczny kontener)
                              ├─ /            → website-dist volume (statyczne Astro)
                              ├─ /admin, /api, /_next → payload:3000 (prywatny)
                              └─ /_astro, /fonts, /video → cache immutable

payload → DATABASE_URL → centralny PostgreSQL (sieć zewnętrzna)
payload → /app/apps/cms/media → payload-media volume (trwały)

website-build (one-shot) → prywatne HTTP do payload → atomowa publikacja dist
```

| Element | Wartość |
|---|---|
| Compose file | `docker-compose.yml` |
| Publiczny port kontenera | `8080` (router) |
| Primary port xCloud | wartość `APP_PORT`, domyślnie `18082` |
| Port Payloada | `3000`, **nie publikowany** |
| Katalog mediów | `/app/apps/cms/media` |
| Volume mediów | `${PAYLOAD_MEDIA_VOLUME}`, domyślnie `adstic-payload-media` |
| Volume dist | `${WEBSITE_DIST_VOLUME}`, domyślnie `adstic-website-dist` |
| Sieć PostgreSQL | `${POSTGRES_NETWORK}`, domyślnie `phobos-internal` |
| Node / pnpm | `22.22.2` / `11.22.0` (ARG w `Dockerfile`, `engines` w `package.json`) |

## 2. Zmienne środowiskowe xCloud

Wszystkie z `.env.example`:

| Zmienna | Wymagana | Uwagi |
|---|---|---|
| `PUBLIC_SITE_URL` | tak | jeden publiczny origin, bez końcowego slasha |
| `CONTENT_SOURCE` | tak | `fixtures` (etap 1) lub `payload` (etap 2) |
| `DATABASE_URL` | tak | hasło URL-encoded |
| `PAYLOAD_SECRET` | tak | długi, losowy, stabilny między deployami |
| `APP_PORT` | tak | **wolny** port hosta, Primary port w xCloud |
| `POSTGRES_NETWORK` | tak | istniejąca sieć centralnej bazy |
| `PAYLOAD_MEDIA_VOLUME` | tak | nie zmieniać po pierwszym deployu |
| `WEBSITE_DIST_VOLUME` | tak | nie zmieniać po pierwszym deployu |
| `DEPLOY_HOOK_URL` | nie | webhook redeployu po zmianie treści |
| `STATIC_BUILD_TOKEN` | nie | sekret prywatnego buildera, bez prefiksu `PUBLIC_` |

`PAYLOAD_API_URL` **nie jest** zmienną xCloud — Compose ustawia
`http://payload:3000/api` wyłącznie dla usługi `website-build`.

## 3. Przed pierwszym wdrożeniem

### 3.0. Staging etapu 1 — bez Payloada

Do czasu uruchomienia modelu treści staging korzysta z
`docker-compose.staging.yml`. Stack zawiera wyłącznie jednorazowy build Astro
z fixtures i Nginx (`docker/nginx.staging.conf`); nie wymaga PostgreSQL,
migracji ani sekretów Payloada. Osobna nazwa projektu Compose
(`adstic-staging`), osobny port hosta i osobny wolumen — może działać obok
innych stagingów na tym samym hoście.

W xCloud:

1. utwórz `Custom Docker` → `Docker Compose From Git`;
2. wskaż repozytorium, branch stagingowy i plik
   `docker-compose.staging.yml`;
3. przypisz domenę `adstic.madebyslate.dev`;
4. ustaw zmienne:

   ```dotenv
   PUBLIC_SITE_URL=https://adstic.madebyslate.dev
   APP_PORT=18085
   WEBSITE_DIST_VOLUME=adstic-staging-website-dist
   ```

5. po wykryciu portów wybierz `18085` jako Primary Service Port;
6. pozostaw Deployment Script pusty — zależność
   `service_completed_successfully` uruchamia router dopiero po poprawnej,
   atomowej publikacji Astro.

Każdy redeploy przebudowuje stronę z bieżących `content/**/*.json`. Trasy
`/admin`, `/api` i `/_next` zwracają 404. Przejście na pełny stack odbywa się
przez zmianę pliku Compose na `docker-compose.yml` i wykonanie procedury z §4;
wolumenu stagingowego nie używa się jako wolumenu produkcyjnego.

Lokalnie **podaj `WEBSITE_DIST_VOLUME` jawnie** — Compose sam wczytuje `.env`
z roota, a tam siedzi produkcyjna nazwa `adstic-website-dist`:

```sh
APP_PORT=18085 \
PUBLIC_SITE_URL=https://adstic.madebyslate.dev \
WEBSITE_DIST_VOLUME=adstic-staging-website-dist \
docker compose -f docker-compose.staging.yml up --build
```

Warunek wstępny (P-048): `content/media/**`, `apps/web/src/assets/**`,
`apps/web/public/fonts/**` i `apps/web/public/video/**` muszą być
**w commicie**. xCloud buduje z klona repozytorium, nie z twojego dysku —
brakujący plik w `content/media/` wywraca build na `media.ts`, a brakujący
font czy wideo z `public/` przechodzi build i psuje dopiero stronę.

### 3.1. Baza

Jako administrator PostgreSQL:

```sql
CREATE ROLE adstic_app WITH LOGIN PASSWORD '<STRONG_PASSWORD>';
CREATE DATABASE adstic OWNER adstic_app ENCODING 'UTF8';
GRANT ALL PRIVILEGES ON DATABASE adstic TO adstic_app;
```

Potwierdź sieć i osiągalność hosta z URL-a:

```sh
docker network inspect phobos-internal
```

### 3.2. Pierwsza migracja — KROK OBOWIĄZKOWY

> Pierwsza migracja (`20260819_142106_initial_schema`) jest już w repozytorium
> i przetestowana na pustej bazie — zakłada tabele `users`, `media`
> i tabele systemowe Payloada. Poniższa procedura dotyczy **kolejnych** zmian
> schematu. Każda zmiana konfiguracji Payloada MUSI mieć migrację w tym samym
> commicie.

```sh
docker compose -f docker-compose.dev.yml up -d          # lokalny PostgreSQL na :5433
cp .env.example .env                                     # ustaw DATABASE_URL na lokalny
pnpm --filter @repo/cms payload migrate:create <nazwa>
```

Następnie:

1. przejrzyj wygenerowane SQL/TS;
2. sprawdź migrację na pustej bazie (`pnpm --filter @repo/cms payload migrate`);
3. dopisz import do `apps/cms/src/migrations/index.ts`;
4. commituj migrację razem ze zmianą konfiguracji Payloada.

Każda kolejna zmiana schematu = nowa migracja w tym samym commicie.

### 3.3. Walidacja lokalna

```sh
docker compose --env-file .env.example config --quiet
docker build --target payload-runtime -t adstic-payload:test .
docker build --target website-builder -t adstic-website-builder:test .
pnpm verify                                              # typecheck + lint + build
```

## 4. Pierwszy deployment (pusta baza)

```sh
docker compose --env-file .env pull
docker compose --env-file .env down
docker compose --env-file .env build --pull payload website-build
docker compose --env-file .env run --rm --no-deps payload node_modules/.bin/payload migrate
docker compose --env-file .env run --rm --no-deps \
  -e DEPLOY_HOOK_URL= -e SEED_ADMIN_EMAIL=<EMAIL> -e SEED_ADMIN_PASSWORD='<HASLO>' \
  payload node_modules/.bin/tsx src/seed/seed.ts
docker compose --env-file .env up -d payload
docker compose --env-file .env run --rm --no-deps website-build
docker compose --env-file .env up -d --remove-orphans
docker compose --env-file .env ps
```

Linię z seedem pomiń, jeśli nie ustawiasz `SEED_ADMIN_EMAIL` /
`SEED_ADMIN_PASSWORD` — pierwsze konto można też założyć ekranem
„create first user" panelu, dostępnym przy pustej kolekcji `users`.

> **Komendy w kontenerze wywołują binarki bezpośrednio, nie przez `pnpm`.**
> Obraz zawiera celowo niepełny workspace (brak `apps/web`), a pnpm 11 wykrywa
> brakujące projekty z `pnpm-workspace.yaml`, odtwarza `node_modules` i pobiera
> zależności z sieci przy KAŻDYM uruchomieniu kontenera — bez TTY kończy się to
> `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`. Zmierzone: start kontenera
> ~21 s z pnpm vs ~2 s bez. Lokalnie `pnpm --filter @repo/cms payload migrate`
> działa normalnie, bo workspace jest kompletny.

## 5. Regularny deploy script xCloud

```sh
docker compose --env-file .env pull
docker compose --env-file .env down
docker compose --env-file .env build --pull payload website-build
docker compose --env-file .env run --rm --no-deps payload node_modules/.bin/payload migrate
docker compose --env-file .env up -d payload
docker compose --env-file .env run --rm --no-deps website-build
docker compose --env-file .env up -d --remove-orphans
docker compose --env-file .env ps
```

Kolejność jest obowiązkowa. **Seed NIE należy do tego skryptu** — nadpisałby
treść edytowaną w panelu.

## 6. Publikacja zmian treści

Astro jest statyczne: zapis w Payload zmienia bazę, ale nie zmienia HTML.
Po zmianie treści:

```sh
docker compose --env-file .env up -d payload
docker compose --env-file .env run --rm --no-deps website-build
docker compose --env-file .env up -d --remove-orphans
```

albo ustaw `DEPLOY_HOOK_URL` na webhook xCloud — hook jest już podpięty
(`apps/cms/src/hooks/triggerDeployHook.ts`), a jego błąd nie blokuje zapisu.

Przy seedzie `DEPLOY_HOOK_URL` MUSI być wyzerowany.

## 7. Przejście z etapu 1 na etap 2

Etap 1 buduje się z `content/pages/*.json` i **nie potrzebuje CMS-a**.
Przełączenie:

1. dodaj kolekcję `Pages` w `apps/cms` jako odwzorowanie unii `Block`
   z `packages/shared/src/blocks/index.ts`;
2. utwórz i przetestuj migrację;
3. ustaw dostęp odczytu kolekcji na `authenticatedOrStaticBuild`
   (`apps/cms/src/access/authenticatedOrStaticBuild.ts`);
4. ustaw w xCloud `CONTENT_SOURCE=payload` i `STATIC_BUILD_TOKEN`;
5. przeseeduj treść z fixtures i uruchom `website-build`.

Komponenty i schematy zod **nie zmieniają się** — zmienia się wyłącznie adapter.

## 8. Odbiór wdrożenia

```sh
docker compose --env-file .env ps
docker compose --env-file .env logs --tail=200 payload
docker compose --env-file .env logs --tail=200 router
```

- `payload` — `Up (healthy)`
- `router` — `Up`
- `website-build` — zakończony (one-shot)

```sh
curl -I https://<DOMAIN>/
curl -I https://<DOMAIN>/admin
curl -I https://<DOMAIN>/api/media/file/<KNOWN_FILE>
curl -sS https://<DOMAIN>/ | grep -E 'payload:3000|localhost|:8080'   # ma nic nie zwrócić
curl -sSI https://<DOMAIN>/kontakt | grep -i '^location:'             # slash, bez :8080
docker volume inspect adstic-payload-media
```

Ten sam warunek jest testowany automatycznie w
`tests/visual/home.spec.ts` („nie ujawnia prywatnych adresów w HTML").

## 9. Backup i restore

Backup produkcji obejmuje **jednocześnie**:

- dump PostgreSQL,
- volume `adstic-payload-media`.

Restore bazy bez odpowiadającego restore mediów zostawi rekordy bez plików —
endpoint rekordu zadziała, a `/api/media/file/...` zwróci `500`.

```sh
# media
docker run --rm -v adstic-payload-media:/data -v "$PWD":/backup alpine \
  tar czf /backup/adstic-media-$(date +%F).tar.gz -C /data .

# restore
docker run --rm -v adstic-payload-media:/data -v "$PWD":/backup alpine \
  tar xzf /backup/adstic-media-<DATA>.tar.gz -C /data
```

**`docker compose down -v` jest zabronione na produkcji.**

## 10. Operacje zabronione

- commitowanie `.env` lub sekretów;
- publikowanie portu Payloada;
- `docker compose down -v`;
- zmiana nazwy volume bez zaplanowanej migracji danych;
- seed przy każdym deployu;
- migracje w entrypoincie kontenera;
- build statycznego Astro przed migracjami i startem Payloada
  (przy `CONTENT_SOURCE=payload`);
- użycie produkcyjnego `DATABASE_URL` podczas `docker build`;
- blokowanie całego `/api` w Nginx przy publicznym panelu;
- `chmod 666 /var/run/docker.sock`.
