# Postęp — Orbita: Starcie

Aktualizacja: 2026-10-25. Etap 7 — oprawa i telefony: IN_PROGRESS. Etapy 1–6 oraz 8–9: DONE. Podetap animacji kulek ukończony i wdrożony.

## Działa

- Lokalna walka, multiplayer 1v1/2v2, trening z botem, 14 kulek ze zdolnościami, celowanie, rewanże i kolekcja Firebase.
- Topór krąży wokół kulki; lufy karabinu obracają się; działa śledzą przeciwnika; Pajęczak animuje odnóża, a sieci obracają się.
- Efekty mocy są wirującymi odłamkami zamiast pulsów. Wiązki/lasery mają ruchomy znacznik i stałą jasność. Ruch efektów zatrzymuje się podczas pauzy; ustawienie reduced motion ogranicza animacje.

## Weryfikacja i wdrożenie

- 48/48 testów, `tsc --noEmit`, produkcyjny build Vite i `git diff --check` — OK.
- GitHub `main`: commit `5de66cf`. Vercel production READY (`dpl_8Tty6V5ffKNMjGDqmDLtcVG4cL45`); alias `https://ballgame-tawny.vercel.app/` zwraca HTTP 200, `/api/room` `online:true`, nowe klientowe i Three.js chunki zwracają 200.
- Nadal nie wykonano ręcznego QA 360×800, landscape ani pomiaru FPS. Wcześniej narzędzie zablokowało dostęp do lokalnej karty; nie omijać tej blokady.

## Dokładny następny krok

Dokończyć brakujące QA etapu 7 na 360×800, landscape i sprawdzić FPS, gdy będzie dostępna dozwolona ścieżka. Nie oznaczać etapu 7 jako DONE przed tą kontrolą.
