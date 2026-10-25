# Wznowienie — Orbita: Starcie

Projekt: `C:\Users\antre\Desktop\ball game`; GitHub `https://github.com/ballgamer4321/BALLGAME`; produkcja `https://ballgame-tawny.vercel.app/`.

## Stan

Etapy 1–6 i 8–9: DONE. Etap 7 pozostaje IN_PROGRESS — brak ręcznego QA 360×800/landscape i pomiaru FPS. Katalog wzrósł z 9 do 16 grywalnych kulek; pięć poprzednich ID wciąż jest ukrytych. Partia 1/6 rozbudowy katalogu jest zaimplementowana i przechodzi testy zdolności: wspólne statusy oraz Blade, Axe, Burst, Charge, Glass, Machine Gun, Poison Spike, Spider i Thief. Arena zachowuje wymiary 20×20. Parametry promptu są balansem własnym i dostosowano je do tej skali. Kod produkcyjny `a3912d4` jest starszy; nowe zmiany nie są wdrożone. Bez push/deploy.

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

Ostatnia weryfikacja: pełne 59/59, TypeScript, Vite build i diff check — OK; symulacja przechodzi wszystkie pary kulek. Skrzynka/ekonomia też przechodzą pełny zestaw; manualne QA/FPS nie wykonano. Nie omijać blokady lokalnej karty innym sterowaniem.

## Aktywne zadanie

Aktywna praca: skrzynka odblokowująca kulki i zmieniona ekonomia. Implementacja gotowa, pełna weryfikacja 59/59, TypeScript i build przeszły. Ustalone wartości: 100 monet za wygraną, 75 za remis, 50 za porażkę, skrzynka 300 monet; losowanie serwerowe wybiera jedną jeszcze nieposiadaną kulkę. Publikacja idzie przez repozytorium GitHub połączone z produkcją Vercel. Katalog jest odrębnym zadaniem etapowym, partia 1/6 gotowa.

Najbliższe działania:
1. Dokończyć publikację `main` i sprawdzić status wdrożenia projektu `ballsteam/ball_game`.
2. Nie pushować ani nie wdrażać bez jawnej dyspozycji. Partię 2/6 katalogu rozpocząć po osobnym poleceniu „kontynuuj”.
