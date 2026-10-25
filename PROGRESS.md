# Postęp — Orbita: Starcie

Aktualizacja: 2026-10-25. Bieżący etap: 7 — oprawa i telefony (IN_PROGRESS; brak ręcznego QA różnych ekranów i FPS). Etapy 1–6 oraz 8–9: DONE. Bieżący podetap całościowego polishu zakończony i opublikowany.

## Działa

- Lokalna walka, multiplayer 1v1/2v2, trening z botem, 14 kulek ze zdolnościami, celowanie, rewanże i kolekcja Firebase.
- Ekran wyniku pokazuje pozostałe HP obu stron i ich skład; HUD odświeża się rzadziej, a selektory DOM są buforowane.
- Metadane i favicon odpowiadają grze. Three.js jest osobnym chunkiem: aplikacja 62 kB, renderer 496 kB; build nie zgłasza przekroczenia rozmiaru pojedynczego pliku.

## Weryfikacja i wdrożenie

- 48/48 testów, `tsc --noEmit`, produkcyjny build Vite i `git diff --check` — OK.
- Kod: commit `8a2ff4e` na GitHub `main`. Vercel production READY (`dpl_HqobMhxf3oSWe2JiQDtyLG46DfQT`); alias `https://ballgame-tawny.vercel.app/` zwraca HTTP 200, `/api/room` zwraca `online:true`; aplikacyjny i Three.js chunk zwracają 200.
- Ręcznej kontroli wizualnej, fizycznego telefonu ani FPS nie wykonano. Wcześniej narzędzie zablokowało dostęp do lokalnej karty; tej blokady nie omijać.

## Dokładny następny krok

Wykonać brakujące QA etapu 7 dla 360×800, landscape i FPS, gdy dostępna będzie dozwolona ścieżka kontroli. Do tego czasu nie oznaczać etapu 7 jako DONE.
