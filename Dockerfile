#
# Adstic — produkcyjny obraz wielostopniowy.
#
# Odstępstwo od szablonu XCLOUD_ASTRO_PAYLOAD_DEPLOYMENT_STANDARD.md §9:
# projekt ma JEDEN lockfile w roocie workspace (pnpm workspaces), a nie osobne
# lockfile w `payload/` i `website/`. Sekcje instalacji są dopasowane do tego
# układu; etapy, granice odpowiedzialności i nazwy targetów (`payload-runtime`,
# `website-builder`) pozostają bez zmian, więc deploy scripty z §18–19 działają
# bez modyfikacji.
#
# ŻADEN etap NIE łączy się z bazą i NIE pobiera treści CMS (§3.5).

ARG NODE_VERSION=22.22.2
ARG PNPM_VERSION=11.22.0


# ─────────────────────────────────────────────────────────────────────────────
# base — wspólny runtime Node + przypięty pnpm
# ─────────────────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-bookworm-slim AS base

ARG PNPM_VERSION
ENV PNPM_HOME=/pnpm
ENV PATH=${PNPM_HOME}:${PATH}
ENV COREPACK_HOME=/corepack

RUN mkdir -p ${COREPACK_HOME} \
  && corepack enable \
  && corepack prepare pnpm@${PNPM_VERSION} --activate \
  && chmod -R a+rX ${COREPACK_HOME}

ENV CI=true

WORKDIR /app


# ─────────────────────────────────────────────────────────────────────────────
# workspace-manifests — same manifesty, żeby warstwa instalacji cache'owała się
# niezależnie od zmian w kodzie źródłowym
# ─────────────────────────────────────────────────────────────────────────────
FROM base AS workspace-manifests

# tsconfig.base.json jest rozszerzany przez packages/shared — bez niego Vite
# przerywa build Astro na „Tsconfig not found".
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/cms/package.json ./apps/cms/
COPY packages/shared/package.json ./packages/shared/
COPY packages/tokens/package.json ./packages/tokens/


# ─────────────────────────────────────────────────────────────────────────────
# cms-dependencies — zależności Payloada i jego workspace'owych zależności
# ─────────────────────────────────────────────────────────────────────────────
FROM workspace-manifests AS cms-dependencies

# Bez cache mounts BuildKit — build ma przejść na każdym builderze xCloud.
RUN pnpm install --frozen-lockfile --filter @repo/cms...


# ─────────────────────────────────────────────────────────────────────────────
# cms-builder — `next build`; nie dotyka bazy
# ─────────────────────────────────────────────────────────────────────────────
FROM cms-dependencies AS cms-builder

COPY packages/shared ./packages/shared
COPY apps/cms ./apps/cms

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm --filter @repo/cms build

# Pliki startowe mediów trzymamy POZA punktem montowania volume — named volume
# zamontowany na media/ zasłoniłby wszystko, co skopiowaliśmy w to miejsce (§13).
RUN mkdir -p /app/apps/cms/media /app/payload-media-seed \
  && if [ -d /app/apps/cms/media-seed ]; then \
       cp -a /app/apps/cms/media-seed/. /app/payload-media-seed/; \
     fi


# ─────────────────────────────────────────────────────────────────────────────
# payload-runtime — prywatna usługa Node, port 3000 NIE jest publikowany
# ─────────────────────────────────────────────────────────────────────────────
FROM base AS payload-runtime

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV PAYLOAD_MEDIA_DIR=/app/apps/cms/media
ENV NODE_OPTIONS=--no-deprecation

WORKDIR /app

# Manifesty workspace — potrzebne, żeby `pnpm --filter` działał w kontenerze
# (migracje i seed uruchamiamy przez pnpm).
COPY --from=cms-builder --chown=node:node /app/package.json ./package.json
COPY --from=cms-builder --chown=node:node /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=cms-builder --chown=node:node /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=cms-builder --chown=node:node /app/.npmrc ./.npmrc

# Dowiązania pnpm wskazują na /app/node_modules/.pnpm — ścieżki w obrazie są
# identyczne jak w etapie builda, więc symlinki pozostają poprawne.
COPY --from=cms-builder --chown=node:node /app/node_modules ./node_modules
COPY --from=cms-builder --chown=node:node /app/packages/shared ./packages/shared
COPY --from=cms-builder --chown=node:node /app/apps/cms ./apps/cms

# Materiał startowy mediów i entrypoint.
COPY --from=cms-builder --chown=node:node /app/payload-media-seed /app/payload-media-seed
COPY --chown=node:node docker/payload-entrypoint.sh /usr/local/bin/payload-entrypoint

RUN mkdir -p /app/apps/cms/media \
  && chown -R node:node /app \
  && chmod 0755 /usr/local/bin/payload-entrypoint

USER node
WORKDIR /app/apps/cms
EXPOSE 3000

# Uruchamiamy binarki bezpośrednio, NIE przez `pnpm <skrypt>`.
#
# Obrazy zawierają celowo niepełny workspace (runtime Payloada nie ma apps/web
# ani packages/tokens). pnpm 11 wykrywa brakujące projekty z pnpm-workspace.yaml,
# odtwarza node_modules i pobiera cały zestaw zależności z sieci przy KAŻDYM
# uruchomieniu kontenera — czyli przy każdym `start`, `migrate` i `seed`.
# Bez TTY kończy się to ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY.
# Ani `verify-deps-before-run=false`, ani `CI=true` tego nie wyłączają.
#
# Odpowiedniki komend z DEPLOYMENT.md:
#   migrate → node_modules/.bin/payload migrate
#   seed    → node_modules/.bin/tsx src/seed/seed.ts
ENTRYPOINT ["payload-entrypoint"]
CMD ["node_modules/.bin/next", "start", "--hostname", "0.0.0.0", "--port", "3000"]


# ─────────────────────────────────────────────────────────────────────────────
# website-dependencies / website-builder — jednorazowy build statycznego Astro
# ─────────────────────────────────────────────────────────────────────────────
FROM workspace-manifests AS website-dependencies

RUN pnpm install --frozen-lockfile --filter @repo/web...


FROM website-dependencies AS website-builder

COPY packages ./packages
COPY content ./content
COPY apps/web ./apps/web
COPY docker/website-build.sh /usr/local/bin/build-static-site

RUN chmod 0755 /usr/local/bin/build-static-site \
  && mkdir -p /output \
  && chown -R node:node /app /output

ENV NODE_ENV=production
USER node
WORKDIR /app

ENTRYPOINT ["build-static-site"]
