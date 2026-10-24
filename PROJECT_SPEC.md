# Orbita: Starcie — specyfikacja

Data ustaleń: 2026-10-21. Nazwa robocza autorskiej gry przeglądarkowej.

Aktualizacja implementacji 2026-10-24: na życzenie użytkownika arena jest kwadratem 20 × 20, kulki mają promienie 1,15–1,22 i wyższe prędkości. Ostatnia poprawka podniosła bazowe szybkości o około 10–12% i zachowuje prędkość każdej kulki po zderzeniu (poza działaniem mocy). Etap 5 dodał osiem autorskich mocy opisanych w `src/shared/config.ts`; nazwy i parametry w poniższym pierwotnym planie nie są już bieżącym balansem. Aby walka była dynamiczniejsza, własny limit rundy wynosi 45 s, dogrywka zaczyna się po 30 s. Wybór kulki i kierunku czeka na decyzje graczy, bez automatycznego wyboru po czasie. Bieżące liczby definiuje kod i README.

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
| Sklep/gacha, trading, reroll podczas walki | Trading w S1, pozostałe zależne od źródła/wersji | Trading i płatne rerolle poza zakresem; kosmetyczny postęp |

## Własne zasady — nie są danymi z Roblox

- Mecz do 3 wygranych rund, konfigurowalne `winsToMatch`. W 2v2 punkt otrzymuje drużyna po eliminacji obu przeciwników. Brak obrażeń sojuszniczych; sojusznicy fizycznie się odbijają.
- Wybór kulki i kierunku bez limitu czasu; walka rusza po zatwierdzeniu wszystkich graczy. Prezentacja wyniku rundy 5 s. Brak wejść sterujących w fazie walki.
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
| Echo / różowe podwójne obręcze | Co 6 s satelita na 2 s, jedno trafienie za 6 na wroga | Dodatkowy obszar kontaktu / tarcza i dystans |

Nie zmieniać parametrów bez testów interakcji. Efekty są obiektami symulacji o ustalonym czasie życia i limitach liczby; rendering tylko odczytuje stan. Testy par wszystkich kulek na stałych seedach służą diagnostyce, nie dowodzą idealnego balansu.

## Prezentacja, postęp, reklamy

Stylistyka: ciemna sportowa arena, czytelna jasna krawędź, kolor drużyny oddzielony od koloru mocy; kule o rozpoznawalnych sylwetkach i materiałach. Kamera pokazuje całe pole, HP i ikony mocy; ślady, trafienia, zniszczenie i wynik. Autorskie generowane dźwięki Web Audio po interakcji użytkownika, wyciszenie, reduced motion, niski poziom jakości i limit DPR. Pointer Events dla myszy/dotyku, kierunek widoczny strzałką; przyciski min. 44 px. Czytelność od etapu 2, dopracowanie w etapie 7.

Etap 8: anonimowy profil z losowym tokenem; zapis serwerowy SQLite na trwałym wolumenie, odblokowania testowe wszystkich kulek, trwałe kosmetyki i wynikające z zakończonych meczów nagrody. Token traci się przy wyczyszczeniu pamięci przeglądarki; bez kont nie ma odzyskiwania ani automatycznej synchronizacji urządzeń. Zmiany nagród wyłącznie przez serwer, idempotencja po matchId.

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
