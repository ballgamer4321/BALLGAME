# Wznowienie — Orbita: Starcie

Projekt: `C:\Users\antre\Desktop\ball game`; GitHub `https://github.com/ballgamer4321/BALLGAME`; produkcja `https://ballgame-tawny.vercel.app/`.

## Stan

Etapy 1–6 i 8–9 są DONE. Etap 7 (oprawa i telefony) pozostaje IN_PROGRESS, bo nie wykonano jeszcze ręcznego QA 360×800/landscape i pomiaru FPS. Ostatnia poprawka: ekran końca meczu pokazuje HP oraz skład obu stron, HUD ogranicza koszt częstych aktualizacji, a metadane i favicon zostały odświeżone. Three.js jest osobnym chunkiem. Kod przechodzi testy i build; publikacja tej poprawki trwa. Nie obchodź blokady narzędzia przeglądarki innym sterowaniem.

## Uruchomienie i weryfikacja

Node.js: `C:\Users\antre\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe` (npm nie jest w PATH).

- Testy: `node node_modules/vitest/vitest.mjs run`
- Typy: `node node_modules/typescript/bin/tsc --noEmit`
- Build: `node node_modules/vite/bin/vite.js build`
- Klient: `node node_modules/vite/bin/vite.js --host 127.0.0.1`
- Serwer: `node node_modules/tsx/dist/cli.mjs src/server/index.ts`
- Lokalny adres: `http://127.0.0.1:5173/`

W PowerShell, jeśli `node` nie jest dostępne, poprzedź każdą komendę pełną ścieżką do `node.exe` powyżej.

## Pliki i dalsze kroki

- `src/client/main.ts` — flow, HUD, wyniki i połączenie.
- `src/client/arena.ts` — scena Three.js; `src/client/style.css` — UI i responsywność.
- `src/simulation/world.ts`, `src/server/rooms.ts`, `tests/` — symulacja, multiplayer i scenariusze.
- `PROGRESS.md` — aktualny status.

1. Opublikować bieżący kod na GitHub `main` (użytkownik wcześniej jawnie zlecił publikację) i upewnić się, że tree odpowiada lokalnej wersji.
2. Sprawdzić automatyczny deploy Vercel: READY, alias produkcyjny i HTTP 200; zweryfikować `/api/room` jako `online:true`.
3. Zaktualizować `PROGRESS.md` wynikiem publikacji.
4. Wrócić do brakującego ręcznego QA etapu 7, jeśli polityka narzędzia pozwoli.

Ostatnie testy przed publikacją: 48/48; TypeScript; Vite build; diff check — OK. Obraz przeglądarki i FPS nie zostały ręcznie sprawdzone.
