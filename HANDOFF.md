# Wznowienie — Orbita: Starcie

Projekt: `C:\Users\antre\Desktop\ball game`; GitHub `https://github.com/ballgamer4321/BALLGAME`; produkcja `https://ballgame-tawny.vercel.app/`.

## Stan

Etapy 1–6 i 8–9 są DONE. Etap 7 (oprawa i telefony) pozostaje IN_PROGRESS: brakuje ręcznego QA 360×800/landscape i pomiaru FPS. Najnowsza lokalna zmiana zamienia pulsujące efekty mocy na animowane odłamki i ruch broni: topór krąży, lufy karabinu obracają się, działa celują, Pajęczak animuje nogami, a lasery i sieci poruszają się. Pauza zatrzymuje te animacje; reduced motion pozostawia efekty statyczne. Testy i build lokalnie przechodzą; publikacja w toku.

## Uruchomienie i weryfikacja

Node.js: `C:\Users\antre\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe` (npm nie jest w PATH).

- Testy: `node node_modules/vitest/vitest.mjs run`
- Typy: `node node_modules/typescript/bin/tsc --noEmit`
- Build: `node node_modules/vite/bin/vite.js build`
- Klient: `node node_modules/vite/bin/vite.js --host 127.0.0.1`
- Serwer: `node node_modules/tsx/dist/cli.mjs src/server/index.ts`
- Lokalny adres: `http://127.0.0.1:5173/`

W PowerShell, jeśli `node` nie jest w PATH, poprzedź każdą komendę pełną ścieżką do `node.exe` powyżej.

## Najważniejsze pliki i dalsze kroki

- `src/client/arena.ts` — modele, animacje broni i efekty Three.js.
- `src/client/main.ts`, `src/client/style.css` — flow, HUD, UI/responsywność.
- `src/simulation/world.ts`, `src/server/rooms.ts`, `tests/` — symulacja i multiplayer.
- Wypchnąć zweryfikowany kod na GitHub i poczekać na Vercel READY; sprawdzić produkcyjne API.
- Dokończyć ręczne QA etapu 7 dla 360×800 i landscape oraz pomiar FPS, gdy dostępna będzie dozwolona ścieżka.

Ostatnie testy: 48/48; TypeScript; Vite build; diff check — OK. Obraz i FPS nie były ręcznie sprawdzone. Nie omijać blokady lokalnej karty przeglądarki.
