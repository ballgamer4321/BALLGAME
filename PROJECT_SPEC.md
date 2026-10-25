# Orbita: Starcie — specyfikacja

Data ustaleń: 2026-10-21. Nazwa robocza autorskiej gry przeglądarkowej.

Aktualizacja implementacji 2026-10-24: na życzenie użytkownika arena jest kwadratem 20 × 20, promienie kulek wynoszą 1,35–1,42, a szybkości podniesiono o około 20% względem poprzedniego balansu. Odbicia zachowują prędkość każdej kulki (poza działaniem mocy). Etap 5 dodał osiem autorskich mocy opisanych w `src/shared/config.ts`; nazwy i parametry w poniższym pierwotnym planie nie są już bieżącym balansem. Aby walka była dynamiczniejsza, własny limit rundy wynosi 45 s, dogrywka zaczyna się po 30 s. Wybór kulki i kierunku czeka na decyzje graczy, bez automatycznego wyboru po czasie. Bieżące liczby definiuje kod i README.

## Zakres i sposób pracy

Gra inspirowana Ball VS Ball od ATYS 3: wybór kulki → przygotowanie → automatyczna walka → wynik → kolejna runda. Docelowo prawdziwe sieciowe 1v1 i 2v2, osobny trening z jawnie oznaczonym botem, co najmniej osiem różnych zdolności, kolekcja, kosmetyka i gotowość do hostingu. Bez WASD podczas walki, ręcznego strzelania, wypychania z platformy i płatnej przewagi. Grafika, nazwy, interfejs oraz dźwięki własne; żadnych pobranych zasobów Roblox.

Obowiązuje późniejszy blok użytkownika: JEDEN etap na wiadomość. Etap 1 kończy się dokumentacją, etap 2 jest lokalnym punktem technicznym, dopiero etap 3 dostarcza multiplayer. Po etapie zatrzymanie do „kontynuuj”. Kod i te dokumenty muszą wystarczyć do wznowienia w nowej sesji. Aktualizować PROGRESS.md i HANDOFF.md po istotnych podzadaniach oraz przed dużą zmianą/testem. Jeśli powstanie repozytorium Git, commitować zweryfikowane własne zmiany lokalnie, bez push i sekretów.

## Referencja i wiarygodność

Nie grano w Roblox i nie obejrzano nagrań. Dwa znalezione adresy YouTube nie zostały pobrane przez narzędzie (Cache miss); tekstowe opisy filmów nie są analizą ich obrazu. Nie ma podstaw do deklaracji dokładnego odtworzenia fizyki, tempa ani parametrów oryginału.

### Źródła sprawdzone 2026-10-21

- S1 — [oficjalna gra ATYS 3](https://www.roblox.com/games/96510596525082/Ball-VS-Ball). Bezpośredni odczyt udostępnił tytuł i autora; indeks tej samej strony zwrócił opis gry (crawl oznaczony jako sprzed dwóch tygodni). Potwierdza automatyczne PvP 1v1/2v2, trzy losowe opcje co rundę, darmowy wybór z kolekcji raz na mecz oraz ponad 40 kulek z umiejętnościami. Nie traktować indeksu jako potwierdzenia bieżącej wersji każdego szczegółu.
- S2 — [Bloxodes: Balls, Gachas and Controls](https://bloxodes.com/wiki/ball-vs-ball). Źródło wtórne: wybór kierunku przed walką, odbicia i automatyczne umiejętności; opisuje monety i losowanie kolekcji. Zgodne z główną pętlą S1, ale nie zastępuje obserwacji rozgrywki.
- S3 — [How to Play](https://ballvsballcodes.org/how-to-play/). Wtórny poradnik deklarujący oparcie na nagraniach z 25–29 września. Wspiera jednorazowe celowanie i wyzwalanie części mocy na ścianach; nie zweryfikowano jego materiałów wideo.
- S4 — [Modes, Rewards and Core Gameplay Loop](https://ballvsball.pro/guides/wiki/). Wtórny opis trzech serc, przeciągania kierunku i eliminacji przez HP. Liczby i pochodzenie puli losowania nie są potwierdzone źródłem pierwotnym.
- S5 — [Balls: Abilities, Crates and Rarities](https://robolibrary.org/wikis/ball-vs-ball/balls). Wtórna lista proponująca m.in. truciznę kontaktową, działka po odbiciu oraz obszary mrozu. To wskazówki projektowe, nie zweryfikowane specyfikacje mocy.
- S6 — [oficjalny opis gry Roblox, aktualny odczyt 2026-10-25](https://www.roblox.com/games/96510596525082/Ball-VS-Ball). Potwierdza zarabianie monet za zwycięstwa, kupowanie i kolekcjonowanie nowych kulek w sklepie oraz przerzut kulki podczas bitwy. Dokładne ceny, rodzaj losowania i koszt przerzutu nie są podane.
- V1 — [Foltyn: ROBLOX BALL VS BALL..](https://www.youtube.com/watch?v=H8DIxKbEZG4), znaleziony opis przypisuje publikację 2026-10-01. V2 — [STUD: ROBLOX BALL VS BALL!](https://www.youtube.com/watch?v=SoY84LgTVpE), opis przypisuje 2026-10-04. Próby otwarcia nieudane; nie wyprowadzono z nich reguł gry.
- Odrzucono jako podstawę sterowania [poradnik z ręcznymi atakami i unikami](https://www.ball-vs-ball-wiki.wiki/en/guides/ball-vs-ball-guide/): sprzeczny z oficjalnym automatycznym PvP. Nie kopiować niesprawdzonych skrótów klawiaturowych ani rerollu w trakcie walki.

### Ustalenia do implementacji

| Mechanika | Status | Decyzja |
| --- | --- | --- |
| Automatyczne PvP, 1v1 i 2v2 | Potwierdzone S1 i wymaganiem użytkownika | Odtworzyć |
| Jedna z trzech losowych kulek na rundę | Potwierdzone S1 | Losuje serwer |
| Własna kolekcja raz za darmo na mecz | Potwierdzone S1 | Osobny limit każdego gracza, reset przy rewanżu |
| Wiele kulek z różnymi mocami | Potwierdzone S1 | Minimum osiem własnych wariantów |
| Kierunek startowy, potem brak sterowania | Wspierane S2/S3; bez weryfikacji wideo | Przyjąć jako jawne założenie zgodne z etapem 4 |
| Moce przy ścianie, kontakcie i upływie czasu | Ściany wspierane S3/S5; dokładne warunki niepewne | Własne, opisane wyzwalacze |
| HP, zamknięta arena i odbicia | Wspierane S2/S4 | Własna symulacja i parametry |
| Trzy serca, punktacja, remisy, nagrody | Tylko opisy wtórne | Konfigurowalny własny wariant poniżej |
| Sklep odblokowujący kulki | Potwierdzony S6; sposób i ceny nieznane | Dodać własny sklep z jawnymi cenami za monety; zachować opis cen jako autorski wariant |
| Gacha, trading i przerzut podczas walki | Trading i przerzut potwierdza opis S1/S6; ceny i zasady przerzutu nieznane | Poza tym podzadaniem; bez wymyślania cen lub udawania zgodności z Roblox |

## Własne zasady — nie są danymi z Roblox

- Mecz do 3 wygranych rund, konfigurowalne `winsToMatch`. W 2v2 punkt otrzymuje drużyna po eliminacji obu przeciwników. Brak obrażeń sojuszniczych; sojusznicy fizycznie się odbijają.
- Wybór kulki i kierunku bez limitu czasu w dwóch kolejnych krokach: najpierw wszyscy wybierają kulki, potem każdy ustawia i zatwierdza kierunek. Prezentacja wyniku rundy 5 s. Brak wejść sterujących w fazie walki.
- Każdy gracz dostaje trzy różne definicje z dostępnej puli. Testowo wszystkie osiem dostępne. Wybór z kolekcji zużywany dopiero po zatwierdzeniu przez serwer.
- Walka najwyżej 60 s: od 45 s nieuniknione obrażenia narastające, przy 60 s porównanie średniego pozostałego HP/maxHP drużyn (polegli liczeni jako zero). Równość lub równoczesna eliminacja oznacza remis bez punktu. Limit 9 rund; potem wynik z punktów lub remis meczu, aby seria remisów nie trwała wiecznie.
- Arena płaska 20 × 20 jednostek; obecne promienie, HP i szybkości są w `src/shared/config.ts`. Brak grawitacji w symulacji, 3D wyłącznie prezentacyjne.
- Rozłączenie: automatyczne decyzje i dalsza walka, 30 s na powrót z tokenem sesji; potem walkower w 1v1, eliminacja nieobecnego w 2v2. Jawne wyjście porzuca slot. Nie podstawiać ukrytego bota. Pusty pokój usuwać po okresie powrotu; bezczynne lobby po 10 min.
- Rewanż wymaga zgody wszystkich obecnych; nowy seed, punkty i limit kolekcji. Bot dostępny tylko w wyraźnie opisanym treningu i podejmuje takie same legalne decyzje.

## Technologia i struktura

TypeScript w całym projekcie. Klient: Vite, Three.js, HTML/CSS dla dostępnego interfejsu. Bez frameworka UI na start. Serwer: Node.js, HTTP i WebSocket (`ws`). Wspólna czysta symulacja TypeScript, walidacja komunikatów schematami (Zod), testy Vitest oraz scenariusze przeglądarkowe Playwright. Wersje dobrać i przypiąć lockfile w etapie 2; nie zainstalowano jeszcze zależności.

Plan katalogów:

```text
src/shared/      typy protokołu, konfiguracja, definicje kulek, seedowany RNG
src/simulation/  ruch, kolizje, obrażenia, zdarzenia, efekty; bez DOM/Three.js
src/client/      scena, interpolacja, UI, dotyk, audio, połączenie
src/server/      pokoje, automat meczu, walidacja, sesje i zapis postępu
tests/          symulacja, przepływ, integracja WebSocket, przeglądarki
public/         własne zasoby
docs/           późniejsza instrukcja hostingu i raporty testów
```

Symulacja 60 Hz, snapshoty 20 Hz, interpolacja około 100 ms. Seedowany RNG i stabilna kolejność jednostek/zdarzeń; czas symulacji pochodzi z ticków. Klient nie wylicza wiążących obrażeń. Lokalny adapter etapu 2 używa tego samego rdzenia, który etap 3 uruchomi na serwerze.

Kolizje: swept circle/time-of-impact względem ścian i innych kulek, obsługa pozostałego czasu kroku, ograniczenie iteracji z bezpiecznym zatrzymaniem i korektą penetracji. Obrażenia na wejściu w kontakt, ponowne uzbrojenie po rzeczywistym rozdzieleniu z tolerancją; nie naliczać co tick. Testować szybkie kule, narożniki, kontakt spoczynkowy i kilka zderzeń w kroku.

Automat serwera: LOBBY → SELECT → AIM → COUNTDOWN → FIGHT → ROUND_RESULT → SELECT/MATCH_RESULT → rewanż/LOBBY. W etapie 3 dopuszczalny uproszczony pojedynczy pojedynek. Wiadomości zawierają typ, identyfikator żądania i numer rundy; serwer sprawdza tożsamość, fazę, zakres kąta i własność wyboru. Walidować także skończoność liczb. Odpowiedzi i snapshoty mają tick/fazę/roundId. Token powrotu losowy, nieujawniany innym uczestnikom; kod pokoju nie zastępuje tokena.

Limity początkowe: wiadomość 4 KB, 20 akcji/s z niewielkim burstem; limity tworzenia pokoi per IP, 4 sloty graczy. Limit globalny pokoi konfigurowalny. Serwer odrzuca niedozwolone akcje i duplikaty. Brak sekretów w kliencie i logach.

Hosting docelowy: jeden proces Node serwuje build klienta i WebSocket pod wspólną domeną, HTTPS/WSS przez reverse proxy, `PORT`, dozwolone originy i trwały wolumen na zapis. Wersja pierwsza bez klastra; restart procesu kończy aktywne mecze. Dockerfile, healthcheck i dokładne komendy dopiero po działającym buildzie. Publikacja online nie jest równoznaczna z uruchomieniem lokalnym.

## Plan ośmiu kulek

Wszystkie nazwy, liczby i dokładne reguły poniżej są AUTORSKIE. Motywy trucizny, działka i mrozu są jedynie inspirowane wtórnym S5; nie deklarujemy wiernego odtworzenia zdolności oryginału. Dane definicji obejmą HP, promień, szybkość, kontakt, cooldown, czas trwania, opis, trigger, wygląd i kontrę.

| Kulka / wygląd | Moc i wyzwalacz | Mocna strona / kontra |
| --- | --- | --- |
| Taran / bursztynowe pierścienie | Co 4 s przyspiesza na 0,6 s; następny kontakt +8 obrażeń | Presja kontaktowa / tarcza |
| Pryzmat / fioletowy kryształ | Odbicie od ściany zostawia laser na 1 s, cooldown 3 s | Kontrola torów / szybki ruch poza linią |
| Żmija / zielone pasma | Kontakt nakłada 3 obrażenia/s przez 3 s; odświeża, bez stosów | Długie walki / szybkie obrażenia Tarana |
| Bastion / niebieski pancerz | Co 5 s tarcza na 2 s pochłania maks. 15 obrażeń | Krótkie ataki / trucizna i częste trafienia |
| Pulsar / złoty rdzeń | Co 4 s fala, promień 3, obrażenia 8 po przekroczeniu frontu | Bliski dystans / atak dystansowy |
| Szron / turkusowe odłamki | Co 3 s zostawia pole na 2 s, spowolnienie 25%, bez kumulacji | Kontrola ruchu / dystans |
| Siewca / pomarańczowe segmenty | Ściana tworzy działko na 4 s, cooldown 5 s, maks. 1; pocisk co 1 s | Presja dystansowa / szybkie zbliżenie |
| Echo / różowy satelita | Co 6 s satelita na 2 s, jedno trafienie za 6 na wroga | Dodatkowy obszar kontaktu / tarcza i dystans |

Nie zmieniać parametrów bez testów interakcji. Efekty są obiektami symulacji o ustalonym czasie życia i limitach liczby; rendering tylko odczytuje stan. Testy par wszystkich kulek na stałych seedach służą diagnostyce, nie dowodzą idealnego balansu.

## Prezentacja, postęp, reklamy

Stylistyka: ciemna sportowa arena, czytelna jasna krawędź, kolor drużyny oddzielony od koloru mocy; kule o rozpoznawalnych sylwetkach i materiałach. Kamera pokazuje całe pole, HP i ikony mocy; ślady, trafienia, zniszczenie i wynik. Autorskie generowane dźwięki Web Audio po interakcji użytkownika, wyciszenie, reduced motion, niski poziom jakości i limit DPR. Pointer Events dla myszy/dotyku, kierunek widoczny strzałką; przyciski min. 44 px. Czytelność od etapu 2, dopracowanie w etapie 7.

Etap 8: anonimowy profil z losowym tokenem; zapis przez Firebase Realtime Database i Firebase Admin SDK w funkcjach Vercel (istniejąca architektura nie zapewnia trwałego wolumenu SQLite). Ścieżka profilu używa SHA-256 tokenu, reguły bazy blokują dostęp klienta; wyczyszczenie pamięci przeglądarki usuwa token i nie ma odzyskiwania ani synchronizacji urządzeń. Wszystkie kulki pozostają testowo dostępne. Kosmetyki są trwałe i zdobywane za zakończone mecze; zmiany nagród wyłącznie przez serwer, idempotencja po losowym matchId.

### Rozszerzenie kolekcji: sklep kulek (2026-10-25)

Oficjalny opis S6 potwierdza sklep odblokowujący kulki, ale nie ceny ani metodę zdobywania. Orbita używa trzech własnych kulek startowych; nie jest to deklaracja odwzorowania oryginalnej ekonomii. Starsze profile są normalizowane do aktualnego rosteru, a pięć tymczasowo wycofanych ID filtruje się z kolekcji. Tryb lokalny i online korzystają z tego samego katalogu. Serwer bierze pulę losowania i wybór z kolekcji z zapisanego inwentarza, a nie z danych przesłanych przez klienta.

### Skrzynka kulek i nagrody (2026-10-25)

Nowy profil zaczyna z trzema kulkami. Wygrana przyznaje 100 monet, remis 75, a przegrana 50. Skrzynka kosztuje 300 monet i losuje po stronie serwera jedną z jeszcze nieposiadanych kulek; nie zwraca duplikatu. Katalog pokazuje status odblokowania, a skrzynka pokazuje saldo, liczbę pozostałych kul i odkrytą nagrodę. Nagroda i odjęcie monet zapisują się atomowo w Firebase Realtime Database. Wartości są balansem Orbity, nie informacją o oficjalnej ekonomii Roblox.

Adapter reklam: `isAvailable`, `showInterstitial`, `showRewarded`. Domyślny dostawca zwraca niedostępność i nic nie wyświetla. Reklamy tylko pomiędzy meczami; nie zatrzymują gotowości pokoju. Kosmetyka za rewarded dopiero po zweryfikowanym potwierdzeniu dostawcy, nigdy za sam callback klienta. Bez dostawcy brak emisji, nagród reklamowych i twierdzeń o przychodzie.

## Etapy i kryteria ukończenia

| Etap | Zakres i dowód ukończenia |
| --- | --- |
| 1 | Zapisane źródła, niepewności, decyzje techniczne, struktura, zasady oraz trzy pliki postępu. Bez implementacji. |
| 2 | Działający lokalny pojedynek dwóch podstawowych kulek w 3D, ruch, ściany, HP i wynik; oddzielny rdzeń; testy kolizji i obrażeń. Jawne oznaczenie trybu lokalnego. |
| 3 | Serwer autorytatywny, pokoje/kod/link, gotowość; dwie niezależne sesje otrzymują te same HP i wynik, potwierdzone testem. |
| 4 | Losowanie trzech, jednorazowa kolekcja, kierunek, rundy, wynik meczu i rewanż bez odświeżenia; test automatu i pełnego meczu. |
| 5 | Osiem odrębnych mocy, opisy i efekty; test każdej aktywacji, wygasania i kluczowych interakcji, szybkie kule bez tunelowania. |
| 6 | Cztery sesje 2v2, jawny bot treningowy, powroty, timeouty, opuszczenie i sprzątanie pokoi; testy scenariuszy sieciowych. |
| 7 | Czytelny komputer i telefon, celowanie dotykiem, dźwięk/wyciszenie/reduced motion; kontrola 360×800 i landscape, pomiar wydajności na dostępnym sprzęcie. |
| 8 | Postęp przeżywa restart serwera/przeglądarki; nagrody idempotentne; brak dostawcy reklam nie blokuje gry; brak płatnej przewagi. |
| 9 | Produkcyjny build, pełne 1v1/2v2 i rewanż, zgodność HP, wszystkie moce, sieć i zapis; instrukcja uruchomienia/hostingu, konfiguracja i uczciwy raport niewykonanych testów. |

Nie deklarować sukcesu testów przeglądarkowych na podstawie samych testów WebSocket. W 1v1 użyć dwóch osobnych kontekstów przeglądarki, w 2v2 czterech. Porównać stan tego samego ticka, nie tylko końcowy napis. Zebrać błędy konsoli i sprawdzić wersję produkcyjną. Brak urządzenia fizycznego oznacza test emulacji, a nie potwierdzenie realnego telefonu. Testy stresowe i publiczne wdrożenie opisać oddzielnie.


### Celowanie na ekranie (2026-10-25)

Kierunek jest osobnym krokiem po wyborze kulki. Sterowanie przypomina opisywany w poradnikach do Ball VS Ball schemat: przeciągnij na arenie od swojej kulki, obserwuj strzałkę toru i zatwierdź przyciskiem „Zablokuj kierunek”. Oryginalna gra opisuje przeciąganie myszą i jawne „Lock Aim”; układ Orbity pozostaje własny i nie używa zasobów Roblox ([Bloxodes](https://bloxodes.com/wiki/ball-vs-ball), [How to Play Ball VS Ball](https://ballvsballcodes.org/how-to-play/)). Ta sama obsługa działa wskaźnikiem dotykowym, a strzałki klawiatury korygują kierunek co 15°. Lokalna i sieciowa ścieżka korzystają z tej samej projekcji wskaźnika na płaszczyznę areny.

### Aktualizacja kulek i efektów (2026-10-25)

Aktualnie dostępnych jest 9 własnych kulek. Czasowo wycofane z wyboru, ofert i sklepu są Wiązka, Pryzmat, Taran, Karabin i Pulsar; zostaną zastąpione nowymi kulkami. Pozostałe role to m.in. Laser (czasowa bariera), Salwa (wachlarz pocisków), Pajęczak (sieć z pułapką) i Topór (krążące ostrze z własnym trafieniem, szybsze i mocniejsze przy małej liczbie HP). Ostrze zadaje obrażenia z własnego hitboxa i nie dodaje bonusu do zwykłego zderzenia kul. Nowe ozdoby są przymocowane do modeli konkretnych kulek; na kulkach nie ma aureoli. Inspiracją są ogólne mechaniki z Ball VS Ball, a geometria, tekstury, trafienia i balans należą do Orbity. Starszy plan ośmiu kulek powyżej jest historyczny; aktualny katalog i balans są w `src/shared/config.ts`.

### Ekran startowy — oprawa arcade

Menu główne pokazuje nagłówek BALL VS BALL w lokalnie dołączonym foncie bitmapowym Press Start 2P i podpis MULTIPLAYER / PHYSICS ARENA na tle przyciemnionej areny. Z głównego ekranu usunięto napis „Orbita: Starcie”; w nagłówku została sama animowana ikona kuli, a licznik monet znajduje się w prawym górnym rogu. Znacznik „Wybierz starcie” leży dyskretnie nad nagłówkiem karty trybów. Tytuły menu i trybów mają krótkie, dynamiczne hasła opisujące zasady pojedynków. Menu ma subtelne animacje wejścia, rozświetlenie tła i kaskadowe pojawianie się trybów, z respektowaniem `prefers-reduced-motion`. Karty wyboru trybu zachowują czytelność na telefonie. Dołączony font jest dystrybuowany z licencją SIL Open Font License.

### Rozbudowa katalogu do 54 kulek (2026-10-25)

Użytkownik dostarczył listę 42 motywów i 12 autorskich propozycji wraz z proponowanymi mechanikami. Nazwy/motywy pierwszej listy są inspiracją wtórnych katalogów; wszystkie statystyki, opisy działania, koszty i balans traktujemy jako projekt Orbity, nie oficjalne wartości Roblox. Arena pozostaje 20×20, symulacja 60 Hz, a mechaniki trzeba dopasować do jej skali i zachować stabilne prędkości zderzeń. Każda kula trafia do wyboru/sklepu dopiero po implementacji i weryfikacji jej realnej zdolności.

Plan wdrożenia w oddzielnych, zatwierdzanych etapach:
1. Wspólne reguły statusów i kule 01–09 (ostrza/topór/szarża/ładunek/odłamki/ostrzał/kolce/sieć/noże).
2. Kule 10–18 (wampir/podział/szachy/kostki/elektryczność/hak/lód/laser/rozwój pomocnika).
3. Kule 19–27 (ogon/strefa/jabłko/wiązka/duży kolec/łuk/działo/sieć elektryczna/mróz).
4. Kule 28–36 (aura/wirus/WDC/bomba/pociąg/kwas/kaktus/Fibonacci/harpun).
5. Kule 37–45 (rój/mikstury/laserowa wieżyczka/kajdany/włócznia/Verity/grawitacja/lustro/magnes).
6. Kule 46–54 (portale/echo/wulkan/sonar/chrono/tarcza/kometa/nasiona/parowanie), HUD diagnostyczny, serię testowych pojedynków i testy interakcji całego katalogu.

Wspólne reguły z promptu (stacki trucizny, podpalenie, najmocniejsze spowolnienie, odporność po CC, leczenie, limit obiektów, trafienie raz na cooldown, brak obrażeń sojuszniczych) są autorską specyfikacją i będą dokładane do wspólnego rdzenia. Nie obiecujemy jednorazowo kompletnego wdrożenia 54 mocy; kolejne grupy stają się dostępne dopiero po implementacji i testach.

#### Punkt kontrolny partii 1/6

Stan na 2026-10-25: partia 1/6 zaimplementowana. Aktywny roster ma 16 kulek (poprzednie 9 oraz Blade, Burst, Charge, Glass, Machine Gun, Poison Spike i Thief; Axe i Spider były już w bazowym rosterze). Do `docs/BALL_ROSTER_PLAN.md` skopiowano pełną listę otrzymaną od użytkownika. Silnik obsługuje trzy stosy trucizny, podpalenie, maksymalne spowolnienie 40%, odporność na kolejne CC oraz limity ataków/obiektów. Wszystkie dziewięć mechanik partii 1 jest aktywne w symulacji, ma opisy, modele i testy. Naprawiono również wznowienie prędkości Burst podczas aktywnego spowolnienia i czas przeładowania Machine Gun (1,5 s). Pełna weryfikacja partii: 59/59 testów, TypeScript, Vite build i `git diff --check`; wszystkie pary dostępnych kulek przechodzą serię symulacyjną. Kolejną pracą jest partia 2/6, uruchamiana dopiero po osobnym poleceniu „kontynuuj”. Zmian nie pushowano ani nie wdrożono.

#### Punkt kontrolny partii 2/6

Stan na 2026-10-25: roster ma 24 grywalne kule. Dodano Wampira, Komórkę, Szachy, Kostkę, Elektryczną, Hak, Lodowy Rozprysk i Reforge oraz przebudowano Laser. Moce mają opisy, charakterystyczne modele/efekty i działają w rdzeniu walki: leczenie z trafienia, podział Komórki bez rekurencji, telegraphed ruch Szachów, pułapki Kostki, ogłuszenie Elektrycznej, przyciąganie Haka, lodowe bomby i odłamki, czasowa ściana Laserowa oraz rozwijający się pomocnik Reforge. Nowe kule pozostają możliwe do zdobycia ze skrzynki; istniejące profile i pokoje zachowują dotychczasowy zestaw 16 kulek.

Weryfikacja: pełny zestaw 69/69 testów, TypeScript, build Vite i `git diff --check` przechodzą. Testy obejmują też wszystkie 24×24 zestawienia kulek. Build emituje ostrzeżenie o chunka Three.js 510,90 kB; kompilacja zakończona powodzeniem. Zmiany zapisano lokalnie; nie pushowano ani nie wdrożono. Partia 3/6 rozpocznie się po kolejnym osobnym poleceniu „kontynuuj”.
