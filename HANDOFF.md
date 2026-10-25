# Wznowienie — Orbita: Starcie

Projekt: `C:\Users\antre\Desktop\ball game`; GitHub `https://github.com/ballgamer4321/BALLGAME`; produkcja `https://ballgame-tawny.vercel.app/`.

## Stan

Etapy 1–6 i 8–9: DONE. Etap 7 pozostaje IN_PROGRESS — nie wykonano ręcznego QA 360×800/landscape ani pomiaru FPS. Obecny podetap poprawia czytelność modeli: wszystkie 14 kulek ma charakterystyczny dodatek, a Topór ma drewniany trzonek, szerokie ostrze i metalową krawędź. Broń porusza się zamiast polegać na pulsującym podświetleniu. Kod/testy/build przechodzą; publikacja w toku.

## Uruchomienie i weryfikacja

Node.js: `C:\Users\antre\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe` (npm nie jest w PATH).

- Testy: `node node_modules/vitest/vitest.mjs run`
- Typy: `node node_modules/typescript/bin/tsc --noEmit`
- Build: `node node_modules/vite/bin/vite.js build`
- Klient: `node node_modules/vite/bin/vite.js --host 127.0.0.1`
- Serwer: `node node_modules/tsx/dist/cli.mjs src/server/index.ts`
- Adres: `http://127.0.0.1:5173/`

W PowerShell, gdy `node` nie jest w PATH, poprzedź komendy pełną ścieżką do `node.exe` wyżej.

## Pliki i dalsze kroki

- `src/client/arena.ts` — modele, animacje, geometria i efekty Three.js.
- `src/client/main.ts`, `src/client/style.css` — flow, HUD, UI.
- `src/simulation/world.ts`, `src/server/rooms.ts`, `tests/` — symulacja, multiplayer, testy.
- Opublikować zweryfikowany model na GitHub i Vercel; sprawdzić HTTP oraz API.
- Następnie wrócić do ręcznego QA 360×800, landscape i FPS. Nie omijać blokady lokalnej karty innym sterowaniem.

Ostatnie testy: 48/48; TypeScript; Vite build; diff check — OK. Ręcznego obrazu/FPS nie sprawdzono.
