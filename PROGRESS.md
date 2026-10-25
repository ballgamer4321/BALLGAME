# Postęp — Orbita: Starcie

Aktualizacja: 2026-10-25. Bieżący etap: 7 — oprawa i telefony (IN_PROGRESS; nadal brakuje ręcznego QA różnych ekranów i FPS). Etapy 1–6 oraz 8–9: DONE. Bieżące zadanie: całościowe dopracowanie interfejsu i wydajności; kod sprawdzony, publikacja tej poprawki jeszcze w toku.

## Działa

- Lokalna walka, multiplayer 1v1/2v2, bot treningowy, 14 kulek ze zdolnościami, celowanie, rewanże i kolekcja Firebase.
- Nowy ekran wyniku pokazuje HP pozostałe obu stron i ich skład. HUD odświeża się rzadziej, selektory są buforowane.
- Metadane i favicon odpowiadają aktualnej grze. Three.js jest wydzielony do osobnego chunku, co usuwa ostrzeżenie o rozmiarze pojedynczego pliku.

## Ostatnia weryfikacja

- 48/48 testów; `tsc --noEmit`; produkcyjny build Vite; `git diff --check` — OK.
- Build: aplikacja 62 kB i chunk Three.js 496 kB (osobne pliki/cache; łączny transfer zależności nadal obejmuje renderer).
- Brak ręcznej kontroli wizualnej, fizycznego telefonu ani pomiaru FPS. Wcześniej dostęp do lokalnej karty przeglądarki został zablokowany; tej blokady nie omijać.

## Dokładny następny krok

Dokończyć publikację zweryfikowanej poprawki na GitHub `main` i Vercel production, sprawdzić READY oraz HTTP 200; następnie wrócić wyłącznie do brakującego QA etapu 7.

Produkcja: https://ballgame-tawny.vercel.app/ .
