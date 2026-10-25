# Wznowienie — Orbita: Starcie

Projekt: `C:\Users\antre\Desktop\ball game`; GitHub `https://github.com/ballgamer4321/BALLGAME`; produkcja `https://ballgame-tawny.vercel.app/`.

## Stan

Etapy 1–6 i 8–9 są DONE. Etap 7 (oprawa i telefony) pozostaje IN_PROGRESS, bo brakuje ręcznego QA 360×800/landscape i pomiaru FPS. Ostatni polish pokazał pozostałe HP i skład obu stron na ekranie wyniku, ograniczył koszt aktualizacji HUD, odświeżył metadane/favicon i rozdzielił bundel Three.js. Poprawka jest na GitHub `main`, a production Vercel jest READY. HTTP: strona 200, `/api/room` `online:true`, oba chunki JS 200. Nie obchodź blokady narzędzia przeglądarki innym sterowaniem.

## Uruchomienie i weryfikacja

Node.js: `C:\Users\antre\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe` (npm nie jest w PATH).

- Testy: `node node_modules/vitest/vitest.mjs run`
- Typy: `node node_modules/typescript/bin/tsc --noEmit`
- Build: `node node_modules/vite/bin/vite.js build`
- Klient: `node node_modules/vite/bin/vite.js --host 127.0.0.1`
- Serwer: `node node_modules/tsx/dist/cli.mjs src/server/index.ts`
- Lokalny adres: `http://127.0.0.1:5173/`

W PowerShell, jeśli `node` nie jest w PATH, poprzedź każdą komendę pełną ścieżką do `node.exe` powyżej.

## Pliki i następne działania

- `src/client/main.ts` — flow, HUD, wyniki; `src/client/arena.ts` — Three.js; `src/client/style.css` — UI/responsywność.
- `src/simulation/world.ts`, `src/server/rooms.ts`, `tests/` — symulacja, multiplayer, scenariusze.
- `PROGRESS.md` — status etapów i aktualne wyniki.

1. Sprawdzić, czy pliki postępu są zsynchronizowane z GitHub po ostatnim opisie READY.
2. Gdy dostępna będzie dozwolona ścieżka, wykonać wizualne QA etapu 7 na 360×800 i w landscape.
3. Zmierzyć FPS WebGL na słabszym sprzęcie albo jawnie zostawić wynik jako niewykonany.
4. Zaktualizować status etapu 7 dopiero po spełnieniu kryteriów.

Ostatnie testy: 48/48; TypeScript; Vite build; diff check — OK. Ręczny obraz i FPS nie zostały sprawdzone.
