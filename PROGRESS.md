# Postęp — Orbita: Starcie

Aktualizacja: 2026-10-25. Etap 7 — oprawa i telefony: IN_PROGRESS. Etapy 1–6 oraz 8–9: DONE. Podetap poprawy modeli kulek zakończony i opublikowany.

## Działa

- Lokalna walka, multiplayer 1v1/2v2, bot, 14 kulek ze zdolnościami, celowanie, rewanże i kolekcja Firebase.
- Każda kulka ma charakterystyczny model wychodzący poza jej obrys. Topór ma teraz wyraźny drewniany trzonek, zakrzywione metalowe ostrze z jasną krawędzią i krąży wokół kulki; przy niskim HP przyspiesza zgodnie z inspiracją Robloxową wersją. Są też m.in. tarcza, kły, kryształ, orbitujące odłamki, lufy, armata i pająk z 8 odnóżami.
- Broń się obraca lub śledzi przeciwnika; odłamki zastępują pulsujące efekty mocy. Pauza i reduced motion ograniczają ruch.

## Weryfikacja i wdrożenie

- TypeScript, build Vite i `git diff --check` — OK dla poprawki topora; chunk Three.js 497,65 kB, bez ostrzeżenia o rozmiarze. Wcześniej 48/48 testów.
- Kod modeli: GitHub `main`, commit `04ca5a0`; Vercel production READY. Alias `https://ballgame-tawny.vercel.app/`: HTTP 200; `/api/room`: `online:true`; klientowy chunk: HTTP 200.
- Nadal nie wykonano ręcznej kontroli obrazu, widoków 360×800/landscape ani pomiaru FPS. Nie omijać wcześniejszej blokady narzędzia przeglądarki.

## Dokładny następny krok

Wypchnąć i opublikować aktualną poprawkę topora, jeśli repozytorium i Vercel są dostępne. Potem wykonać brakujące QA etapu 7 dla małego i poziomego ekranu oraz pomiar FPS, gdy dostępna będzie dozwolona ścieżka. Nie oznaczać etapu 7 jako DONE przed tą kontrolą.
