# Wznowienie — Orbita: Starcie

Projekt: `C:\Users\antre\Desktop\ball game`; GitHub `https://github.com/ballgamer4321/BALLGAME`; produkcja `https://ballgame-tawny.vercel.app/`.

## Stan i aktywne zadanie

Etapy 1–6 i 8–9: DONE. Etap 7 pozostaje IN_PROGRESS — brak ręcznego QA 360×800/landscape i pomiaru FPS. Partia 2/6 jest zakończona: roster 24 kulek, 69/69 testów, TypeScript, build i `git diff --check` przechodzą. Ostatnia zmiana UI usuwa branding „Orbita: Starcie” i dodaje animowane wejście menu oraz subtelny ruch. Build ostrzega o chunka Three.js 510,90 kB. Zmiany zapisane lokalnie; nie pushować ani nie wdrażać. Statystyki są autorskim balansem do areny 20×20.

## Uruchomienie i weryfikacja

Node.js: `C:\Users\antre\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe` (npm nie jest w PATH).

- Testy: `node node_modules/vitest/vitest.mjs run`
- Typy: `node node_modules/typescript/bin/tsc --noEmit`
- Build: `node node_modules/vite/bin/vite.js build`
- Klient: `node node_modules/vite/bin/vite.js --host 127.0.0.1`
- Serwer: `node node_modules/tsx/dist/cli.mjs src/server/index.ts`
- Lokalny adres: `http://127.0.0.1:5173/`

## Pliki i następne działania

- Plan partii: `docs/BALL_ROSTER_PLAN.md`; stan: `PROGRESS.md`.
- Symulacja: `src/simulation/world.ts`; katalog i progresja: `src/shared/config.ts`, `src/shared/progression.ts`.
- Modele i animacje: `src/client/arena.ts`; HUD/wybór: `src/client/main.ts`.
- Wsteczna zgodność pokoi: `src/server/rooms.ts`; testy: `tests/abilities.test.ts`, `tests/progression.test.ts`, `tests/rooms.test.ts`.

1. Partia 2/6 jest zweryfikowana i zakończona; sprawdzić stan lokalnego commita.
2. Następna praca to partia 3/6, po nowym poleceniu użytkownika.
3. Nie pushować ani nie wdrażać.

Ostatnia zweryfikowana baza przed tą partią: 59 testów, TypeScript i build OK. Po partii 2 pełny zestaw to 69 testów. Ręczne QA i pomiar FPS nie były wykonane; nie omijać blokady narzędzia przeglądarki.
