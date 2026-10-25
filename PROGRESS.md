# Postęp — Orbita: Starcie

Aktualizacja: 2026-10-25. Etap 7 — oprawa i telefony: IN_PROGRESS. Etapy 1–6 oraz 8–9: DONE. Rozbudowa katalogu do 54 kulek: partia 2/6 DONE lokalnie; nieopublikowana.

## Aktualne zadanie — katalog 54 kulek

- 1/6: DONE — wspólne reguły statusów i działające kule Blade, Axe, Burst, Charge, Glass, Machine Gun, Poison Spike, Spider i Thief. Katalog wzrósł z 9 do 16 grywalnych kulek.
- 2/6: DONE — Wampir, Komórka, Szachy, Kostka, Elektryczna, Hak, Lodowy Rozprysk, odświeżony Laser i Reforge. Moce, modele 3D, selekcja/sklep i pola sieciowe są dodane oraz zweryfikowane.
- 3/6: Snake, Zone, Apple, Beam, Big Spike, Bow, Cannon, Electro King i Frost.
- 4/6: Range, Virus, WDC, Bomb, Conductor, Acid, Cactus, Fibonacci i Harpoon.
- 5/6: Hive, Potion, Ray, Shackles, Spear, Verity, Gravity, Mirror i Magnet.
- 6/6: Portal, Echo, Volcano, Sonic, Chrono, Shield, Comet, Seed i Parry; HUD testowy, balance runs i testy interakcji całości.
- Liczby z promptu są założeniami własnego balansu. Arena zostaje 20×20; rzeczywiste statystyki są skalowane do obecnego rdzenia. Nie dodawać niezaimplementowanej kuli do wyboru ani sklepu.
- Poprzedni stan przed tym zadaniem: roster 9, testy 50/50, TypeScript i build OK; ostatni commit `c44d624`.

## Działa

- Lokalna walka, multiplayer 1v1/2v2, bot, 24 dostępne kule ze zdolnościami, celowanie, rewanże, profil Firebase, sklep i kolekcja kosmetyczna.
- Modele dostępnych kulek mają charakterystyczne sylwetki. Topór ma drewniany trzonek, zakrzywione metalowe ostrze i własne trafienia; przy niskim HP przyspiesza zgodnie z inspiracją Robloxową wersją. Pięć kulek — Wiązka, Pryzmat, Taran, Karabin i Pulsar — wycofano tymczasowo z katalogu, wyboru, sklepu i ofert meczowych, aby zastąpić je nowymi.
- Ostrze topora działa teraz jako osobna broń: krąży przy ziemi, trafia wroga niezależnie od zderzenia kulek, a przy utracie HP obraca się szybciej i zadaje do 12 obrażeń. Obrażenia zwykłego zderzenia pozostają bez bonusu topora.
- Główny ekran ma tytuł BALL VS BALL, przyciemnioną arenę i kompaktowy panel trybów. Usunięto branding „Orbita: Starcie”, licznik monet przeniesiono do prawego górnego rogu, a znacznik wyboru trybu umieszczono nad kartą menu. Pojawianie się menu, kart, tła i ikony kuli jest animowane, z obsługą `prefers-reduced-motion`. Font Press Start 2P i licencja OFL są dołączone lokalnie.
- Broń się obraca lub śledzi przeciwnika; odłamki zastępują pulsujące efekty mocy. Pauza i reduced motion ograniczają ruch.

## Weryfikacja i wdrożenie

- Stan partii 1/6: dziewięć działających zdolności i wspólne statusy (trucizna do 3 stosów, podpalenie, najmocniejsze spowolnienie z limitem 40%, okno odporności CC), limity pułapek/odłamków oraz cooldowny trafień. Burst zachowuje spowolnienie; Machine Gun przeładowuje się dokładnie 1,5 s. Nowe kule pojawiają się w katalogu i selekcji po odblokowaniu.
- Pełne testy 59/59, TypeScript, build Vite i `git diff --check` — OK. Testy przechodzą wszystkie pary 16 kulek i sprawdzają m.in. czas przeładowania, statusy, aktywacje, limity i wygaśnięcia. Chunk Three.js 497,66 kB.
- Partia 2/6: aktywny roster ma 24 kule. Pełny zestaw 69/69 testów, TypeScript, build i `git diff --check` przechodzą; test wszystkich 24×24 par także przechodzi. Build emituje ostrzeżenie o chunka Three.js 510,90 kB.
- Nowe profile zachowują startową trójkę, a stare profile bez zapisanej kolekcji zachowują wcześniejsze 16 kulek. Osiem dodanych w tej partii kulek zostaje dostępnych ze skrzynki, bez darmowego odblokowania na istniejących kontach.
- Kod modeli: GitHub `main`, commit `a3912d4`; Vercel production READY, deployment `dpl_GebA7kdKaFychEQNuoJqxns36wPb`. Alias `https://ballgame-tawny.vercel.app/`: HTTP 200; `/api/room`: `online:true`; nowy chunk klienta: HTTP 200.
- Nowy sklep nie jest jeszcze wdrożony; produkcja nadal zawiera wersję przed sklepem. Nadal nie wykonano ręcznej kontroli obrazu, widoków 360×800/landscape ani pomiaru FPS. Nie omijać wcześniejszej blokady narzędzia przeglądarki.

Nowa funkcja: skrzynka do odblokowywania kulek i ekonomia monet. Założenia: start z 3 kulkami, wygrana +100, remis +75, porażka +50, skrzynka 300 monet; jedno losowanie wybiera jedną nieposiadaną kulkę, bez duplikatów. Katalog 54 kulek pozostaje osobnym zadaniem etapowym; partia 1/6 jest gotowa, a jej kod wraz ze skrzynką przygotowano do publikacji przez GitHub → Vercel.

Weryfikacja funkcji skrzynki: 59/59 testów, TypeScript, Vite build i `git diff --check` — OK. Wynik losuje serwer w transakcji Firebase i zapisuje kulkę razem z opłatą. Ręczny test interfejsu nie był wykonywany.

## Dokładny następny krok

Partia 2/6 jest zakończona i zapisana lokalnie. Następne zadanie to partia 3/6 w `docs/BALL_ROSTER_PLAN.md`, dopiero po osobnym poleceniu „kontynuuj”. Nie pushować ani nie wdrażać.
