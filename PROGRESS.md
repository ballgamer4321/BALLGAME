# Postęp — Orbita: Starcie

Aktualizacja: 2026-10-25. Etap 7 — oprawa i telefony: IN_PROGRESS. Etapy 1–6 oraz 8–9: DONE. Bieżący podetap: czytelne modele 3D dla kulek; kod zaimplementowany i sprawdzony, publikacja w toku.

## Działa

- Lokalna walka, multiplayer 1v1/2v2, bot, 14 kulek ze zdolnościami, celowanie, rewanże i kolekcja Firebase.
- Każda kulka ma rozpoznawalny model wystający poza obrys kuli: m.in. drewniany topór z szerokim metalowym ostrzem, tarczę, kły, kryształ, orbitujące odłamki, lufy, armatę i pająka z 8 nogami.
- Broń obraca się lub śledzi cel; nogi Pajęczaka pracują; laser i wiązka mają ruchome znaczniki. Animowane odłamki zastępują pulsujące podświetlenia mocy. Pauza i reduced motion ograniczają ruch.

## Weryfikacja

- 48/48 testów, TypeScript, build Vite i `git diff --check` — OK.
- Build bez ostrzeżenia; aplikacja ok. 68 kB, renderer Three.js ok. 498 kB.
- Nie wykonano ręcznego QA 360×800, landscape ani pomiaru FPS. Nie omijać blokady narzędzia przeglądarki.

## Dokładny następny krok

Opublikować nowe modele, sprawdzić Vercel READY i odpowiedź strony/API, uaktualnić ten wpis, a potem wrócić do brakującego QA etapu 7.
