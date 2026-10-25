# Wznowienie — Orbita: Starcie

Projekt: `C:\Users\antre\Desktop\ball game`; GitHub `https://github.com/ballgamer4321/BALLGAME`; produkcja `https://ballgame-tawny.vercel.app/`.

## Stan

Etapy 1–6 i 8–9: DONE. Etap 7 pozostaje IN_PROGRESS — brak ręcznego QA 360×800/landscape i pomiaru FPS. Modele wszystkich 14 kulek zostały poprawione i wdrożone. Topór ma wyraźny drewniany trzonek, zakrzywione metalowe ostrze z jasną krawędzią i krąży wokół kulki; obraca się szybciej przy niskim HP, tak jak w Robloxowej inspiracji. Pozostałe kulki mają własne dodatki rozpoznawalne po sylwetce. Broń jest animowana zamiast pulsujących aureoli. Produkcja READY; strona i API 1v1 odpowiadają poprawnie. Ręcznego obrazu nie sprawdzono.

## Uruchomienie i weryfikacja

Node.js: `C:\Users\antre\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe` (npm nie jest w PATH).

- Testy: `node node_modules/vitest/vitest.mjs run`
- Typy: `node node_modules/typescript/bin/tsc --noEmit`
- Build: `node node_modules/vite/bin/vite.js build`
- Klient: `node node_modules/vite/bin/vite.js --host 127.0.0.1`
- Serwer: `node node_modules/tsx/dist/cli.mjs src/server/index.ts`
- Adres: `http://127.0.0.1:5173/`

W PowerShell, gdy `node` nie jest w PATH, poprzedź komendy pełną ścieżką do `node.exe` powyżej.

## Pliki i następne kroki

- `src/client/arena.ts` — modele, geometria i animacje Three.js.
- `src/client/main.ts`, `src/client/style.css` — flow, HUD i UI.
- `src/simulation/world.ts`, `src/server/rooms.ts`, `tests/` — symulacja i multiplayer.
- Gdy będzie dostępna dozwolona ścieżka: sprawdzić modele wizualnie na 360×800 i landscape, zmierzyć FPS, potem ocenić etap 7.

Ostatnie testy: 48/48 (przed obecną poprawką); TypeScript, Vite build i diff check dla poprawki topora — OK, chunk Three.js 497,65 kB bez ostrzeżenia. Manualne QA/FPS nadal niewykonane. Nie omijać blokady lokalnej karty innym sterowaniem.
