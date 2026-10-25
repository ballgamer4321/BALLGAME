# Wznowienie — Orbita: Starcie

Projekt: `C:\Users\antre\Desktop\ball game`; GitHub `https://github.com/ballgamer4321/BALLGAME`; produkcja `https://ballgame-tawny.vercel.app/`.

## Stan

Etapy 1–6 i 8–9: DONE. Etap 7 (oprawa i telefony): IN_PROGRESS — wciąż brak ręcznego QA 360×800/landscape i pomiaru FPS. Wdrożone animacje: topór wiruje wokół kulki, lufy karabinu obracają się, działa namierzają wroga, nogi Pajęczaka się ruszają, sieci obracają się, a lasery i wiązki mają ruchome znaczniki. Pulsujące efekty mocy zastąpiono obracającymi się odłamkami. Pauza/reduced-motion ograniczają ruch. Produkcja READY, strona 200, API `/api/room` zwraca `online:true`.

## Uruchomienie i weryfikacja

Node.js: `C:\Users\antre\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe` (npm nie jest w PATH).

- Testy: `node node_modules/vitest/vitest.mjs run`
- Typy: `node node_modules/typescript/bin/tsc --noEmit`
- Build: `node node_modules/vite/bin/vite.js build`
- Klient: `node node_modules/vite/bin/vite.js --host 127.0.0.1`
- Serwer: `node node_modules/tsx/dist/cli.mjs src/server/index.ts`
- Lokalny adres: `http://127.0.0.1:5173/`

W PowerShell poprzedź komendy pełną ścieżką do `node.exe`, jeśli `node` nie jest w PATH.

## Pliki i następne kroki

- `src/client/arena.ts` — modele, animacje i efekty Three.js.
- `src/client/main.ts`, `src/client/style.css` — flow, HUD, UI/responsywność.
- `src/simulation/world.ts`, `src/server/rooms.ts`, `tests/` — symulacja, multiplayer i scenariusze.
- Gdy będzie dozwolona ścieżka, wykonać QA etapu 7 na 360×800 oraz landscape, zmierzyć FPS i dopiero wtedy zmienić status etapu.

Ostatnie testy: 48/48; TypeScript; Vite build; diff check — OK. Ręcznego obrazu i FPS nie sprawdzono. Nie obchodzić blokady lokalnej karty przeglądarki.
