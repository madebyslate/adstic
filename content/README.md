# `content/` — fixtures etapu 1

Treść statyczna, z której buduje się strona, dopóki `CONTENT_SOURCE=fixtures`.

```
content/
├── pages/<slug>.json   tablica bloków strony, walidowana zod przy buildzie
└── media/              obrazy treściowe przetwarzane przez astro:assets
```

Zasady (AGENT-RULES §2.4):

- `pages/<slug>.json` MUSI przechodzić schemat `Page` z `@repo/shared`.
  Rozjazd schematu i fixture wywala build — to jest zamierzone.
- Teksty to **prawdziwe treści z Figmy**, nie lorem ipsum i nie placeholdery.
  Pliki dostarczone w scaffoldzie są oznaczone słowem „placeholder” i MUSZĄ
  zostać podmienione przy kodowaniu odpowiedniego bloku.
- Obrazy leżą w `media/` i są importowane przez `astro:assets` — stąd realne
  wymiary w fixture muszą zgadzać się z plikiem.
- Wideo NIE leży tutaj. Zakodowane pliki trafiają do `apps/web/public/video/`
  (patrz `scripts/encode-video.sh`), surowe źródła nie wchodzą do repo.

Po podłączeniu Payloada (`CONTENT_SOURCE=payload`) ten katalog przestaje być
źródłem produkcyjnym, ale zostaje jako dane dla testów wizualnych i lokalnego
dev bez CMS-a.
