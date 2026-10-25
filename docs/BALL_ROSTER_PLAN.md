Poniżej masz **gotowy prompt do tworzenia kulek**, z 42 kulami wymienianymi w dostępnych katalogach oraz 12 nowymi pomysłami.

**Ważne:** sprawdziłem źródła 25.10.2026, ale katalogi mogą nie obejmować najnowszych aktualizacji. Nazwy i ogólny charakter istniejących kul pochodzą z [Bloxodes](https://bloxodes.com/wiki/ball-vs-ball/balls) oraz [Ball vs Ball Codes](https://ballvsballcodes.org/balls/). **Wszystkie liczby w poniższym prompcie to moje propozycje balansu do własnej gry — nie oficjalne statystyki Robloxa.**

Skopiuj cały tekst poniżej:

```text
Stwórz system kulek do gry inspirowanej Roblox Ball VS Ball.
Gra polega na automatycznych pojedynkach kul odbijających się od ścian.
Gracz wybiera kulę i kierunek startowy. Podczas walki umiejętności
aktywują się automatycznie.

Zaimplementuj opisane poniżej kule, ich mechaniki, obrażenia,
efekty wizualne i ograniczenia. Nie twórz jedynie ich wyglądu:
każda umiejętność musi faktycznie działać.

WAŻNE:
- Istniejące nazwy i podstawowe motywy służą jako inspiracja.
- Wszystkie podane statystyki są projektowanym balansem naszej gry.
- Nie przedstawiaj ich jako oficjalnych wartości z Roblox.
- Korzystaj z własnych modeli, ikon, dźwięków i efektów.
- Jeśli projekt już istnieje, dopasuj system do jego technologii.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. WSPÓLNE ZASADY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STATYSTYKI:
- Domyślne HP: 100.
- Domyślna prędkość: 18 jednostek/s.
- Domyślna średnica kuli: 2 jednostki.
- Arena referencyjna: 60 × 40 jednostek.
- Domyślne obrażenia ciałem: 0.
- Obrażenia ciałem występują tylko tam, gdzie podano je jawnie.
- DMG oznacza obrażenia.
- CD oznacza czas odnowienia.
- DOT oznacza obrażenia rozłożone w czasie.
- Wszystkie wartości przechowuj w konfiguracji.

RUCH I TRAFIENIA:
- Kule poruszają się i odbijają automatycznie.
- Po zatrzymaniu przez efekt kontroli wracają do ruchu.
- Pociski muszą fizycznie trafić w cel.
- Broń orbitująca zadaje obrażenia swoim hitboxem.
- Stały kontakt nie może zadawać obrażeń co klatkę.
- Domyślny odstęp trafień jednego źródła w jeden cel: 0,5 s.
- Dla pocisków jednorazowych: jedno trafienie na pocisk.
- Kolizja ze ścianą oznacza nowe uderzenie, nie ciągłe dotykanie.

EFEKTY:
- Trucizna: 2 DMG/s przez 3 s, maksymalnie 3 stosy.
- Każdy stos trucizny ma własny czas trwania.
- Podpalenie: 3 DMG/s przez 3 s, bez kumulowania.
- Ponowne podpalenie odświeża czas.
- Spowolnienia nie sumują się; obowiązuje najsilniejsze, maks. 40%.
- Po ogłuszeniu lub zamrożeniu cel ma 2 s odporności
  na kolejne efekty pełnego unieruchomienia.
- Leczenie nie przekracza maksymalnego HP.
- Kradzież życia bazuje na faktycznie zabranym HP.
- Domyślnie brak obrażeń sojuszniczych w 2v2.
- Wszystkie pułapki mają limit liczby i czas istnienia.
- Przekroczenie limitu usuwa najstarszy obiekt właściciela.

CZYTELNOŚĆ:
- Pokaż HP, tarczę, statusy i ładowanie głównej umiejętności.
- Duży atak sygnalizuj przed zadaniem obrażeń.
- Rozróżniaj ataki przeciwnika i sojusznika kolorem obrysu.
- Wygląd kuli powinien od razu sugerować jej mechanikę.
- Efekty nie mogą zasłaniać pola walki.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. KULE ISTNIEJĄCE — WŁASNA WERSJA BALANSU
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

W każdej pozycji ogólny motyw nawiązuje do istniejącej kuli.
Szczegółowe reguły i liczby poniżej są naszym projektem.

01. BLADE BALL — orbitujące ostrza
- HP: 100.
- Startuje z jednym ostrzem.
- Co 4 s otrzymuje kolejne, maksymalnie 5.
- Ostrze: 6 DMG; zasięg orbity: 3 jednostki.
- Wszystkie ostrza dzielą odstęp trafień 0,4 s na cel.
- Słabość: mały zasięg i powolny rozwój.

02. AXE BALL — obracający się topór
- HP: 110.
- Topór: 12 DMG, zasięg 3,2.
- Prędkość obrotu rośnie od 0,7 do 1,8 obrotu/s
  proporcjonalnie do utraconego HP.
- Odstęp trafień: 0,6 s.
- Słabość: atakuje tylko fragment przestrzeni wokół siebie.

03. BURST BALL — szarża
- HP: 100.
- Co 3 s celuje przez 0,35 s, następnie szarżuje przez 0,45 s.
- Prędkość szarży: 40 jednostek/s.
- Pierwsze trafienie podczas szarży: 16 DMG i odrzut.
- Słabość: po rozpoczęciu szarży nie skręca.

04. CHARGE BALL — ładowane uderzenie
- HP: 110.
- Kontakt: 4 DMG + 3 DMG za każdą pełną sekundę ładowania.
- Maksymalnie 25 DMG.
- Ładunek zeruje się po skutecznym trafieniu przeciwnika.
- Odstęp obrażeń ciałem: 0,8 s.
- Słabość: częste kontakty uniemożliwiają pełne ładowanie.

05. GLASS BALL — odłamki
- HP: 80.
- Kolizja ze ścianą lub przeciwnikiem tworzy 6 odłamków.
- Wspólny CD tworzenia: 1,2 s.
- Odłamek: 3 DMG, czas życia 1,5 s.
- Maksymalnie 3 odłamki jednej eksplozji mogą trafić ten sam cel.
- Słabość: niskie HP.

06. MACHINE GUN BALL — ostrzał
- HP: 90.
- Strzela w najbliższego przeciwnika: 2 DMG co 0,2 s.
- Po 15 strzałach przeładowuje się przez 1,5 s.
- Pociski bez naprowadzania, prędkość 32 jednostki/s.
- Słabość: przeładowanie i możliwość nietrafienia.

07. POISON SPIKE BALL — zatrute kolce
- HP: 100.
- Odbicie od ściany pozostawia kolec; CD: 0,7 s.
- Kolec: 4 DMG i 1 stos trucizny.
- Po trafieniu znika.
- Limit: 8 kolców, czas życia: 12 s.
- Słabość: wymaga kontaktu przeciwnika ze ścianami.

08. SPIDER BALL — pajęczyny
- HP: 95.
- Odbicie od ściany tworzy pajęczynę; CD: 1 s.
- Promień: 3; czas życia: 6 s; limit: 4.
- W środku: 2 DMG/s i spowolnienie 30%.
- Nakładające się sieci tego samego właściciela nie sumują DPS.
- Słabość: niewielkie obrażenia bez utrzymania celu w sieci.

09. THIEF BALL — noże
- HP: 90.
- Nóż: 5 DMG, strzał w najbliższego przeciwnika.
- Odstęp strzałów maleje liniowo z 1,1 s przy pełnym HP
  do 0,4 s przy 20% HP.
- Słabość: największa siła pojawia się blisko śmierci.

10. VAMPIRE BALL — wysysanie życia
- HP: 90.
- Kontakt rozpoczyna przyczepienie na 1,2 s; CD: 4 s.
- Trzy impulsy po 3 DMG.
- Leczy się za faktycznie zadane obrażenia.
- Po zakończeniu kule zostają rozdzielone lekkim odrzutem.
- Słabość: potrzebuje bezpośredniego kontaktu.

11. CELL BALL — podział
- HP: 90.
- Co 5 s zwiększa rozmiar o 8%, maksymalnie 5 razy.
- Kontakt: 5 DMG, odstęp 0,8 s.
- Po śmierci tworzy 2 małe kule z 15 HP każda.
- Każdy etap wzrostu dodaje małym kulom po 2 HP.
- Małe kule: 3 DMG kontaktowe, bez kolejnych podziałów.
- Właściciel przegrywa dopiero po zniszczeniu obu.
- Słabość: rosnący hitbox.

12. CHESS BALL — ruchy figur
- HP: 100.
- Co 5 s przemieszcza się do środka, bez obrażeń podczas dojazdu.
- Następnie losuje wzór: wieża, goniec lub skoczek.
- Pokazuje trasę przez 0,6 s i wykonuje atak.
- Trafienie: 18 DMG, maksymalnie raz na cel w aktywacji.
- Słabość: widoczna trasa.

13. DICE BALL — kostki
- HP: 100.
- Co 2 s zostawia kostkę z wynikiem 1–6.
- Kontakt przeciwnika z kostką: tyle DMG, ile oczek.
- Po trafieniu kostka losuje nowy wynik.
- Odstęp trafień kostki: 0,8 s.
- Limit: 5 kostek; czas życia: 10 s.
- Słabość: zmienny rezultat.

14. ELECTRIC BALL — porażenie
- HP: 100.
- Kontakt przy gotowej umiejętności: 8 DMG
  i ogłuszenie na 0,35 s.
- CD: 2,5 s.
- Słabość: poza aktywacją nie zadaje obrażeń ciałem.

15. HOOK BALL — hak i obrót
- HP: 105.
- Co 4 s wystrzeliwuje hak, zasięg 12.
- Trafienie: 5 DMG.
- Przez 0,8 s obraca trafionego przeciwnika wokół siebie,
  następnie wyrzuca go z dodatkowymi 7 DMG.
- Słabość: chybiony hak zużywa pełny CD.

16. ICE CONE BALL — lodowy rozprysk
- HP: 95.
- Co 3 s pozostawia bombę wybuchającą po 1,5 s.
- Wybuch wypuszcza 8 lodowych odłamków.
- Odłamek: 4 DMG i spowolnienie 25% na 1 s.
- Maksymalnie 3 odłamki na jeden cel z jednej bomby.
- Słabość: opóźnienie wybuchu.

17. LASER BALL — laserowe przeszkody
- HP: 95.
- Uderzenie w ścianę tworzy linię lasera długości 12,
  skierowaną do wnętrza areny; CD: 1,5 s.
- Ostrzeżenie: 0,4 s; aktywność: 4 s.
- Przecięcie linii: 6 DMG; odstęp trafień: 0,75 s.
- Maksymalnie 3 lasery.
- Słabość: nieruchome ataki.

18. REFORGE BALL — rozwijany pomocnik
- HP: 100.
- Pierwsze odbicie tworzy jednego orbitującego pomocnika.
- Początkowe obrażenia pomocnika: 3.
- Ponowny kontakt pomocnika z główną kulą zwiększa DMG o 1.
- Ulepszenie najwyżej raz na 1,5 s; maksymalnie 11 DMG.
- Odstęp trafień pomocnika: 0,7 s.
- Słabość: potrzebuje czasu na rozwój.

19. SNAKE BALL — rosnący ogon
- HP: 100.
- Co 3 s dodaje segment ogona, maksymalnie 10.
- Ogon odwzorowuje wcześniejszą trasę ruchu.
- Trafienie ogonem: 4 DMG i lekki odrzut.
- Wszystkie segmenty dzielą odstęp 0,5 s na cel.
- Słabość: krótki ogon na początku.

20. ZONE BALL — wydzielana strefa
- HP: 95.
- Dotknięcie dwóch różnych ścian wyznacza linię podziału.
- Mniejsza część areny staje się strefą obrażeń.
- Strefa: 2 DMG co 0,5 s przez 5 s.
- CD tworzenia: 4 s; maksymalnie 1 aktywna strefa.
- Słabość: wymaga odpowiedniej trasy odbić.

21. APPLE BALL — jabłka
- HP: 95.
- Co 2,5 s wyrzuca jabłko.
- Zebranie przez siebie lub sojusznika: leczenie 5 HP.
- Kontakt przeciwnika: 7 DMG.
- Jabłko znika po pierwszym kontakcie.
- Limit: 4; czas życia: 8 s.
- Słabość: nie gwarantuje, kto zbierze jabłko.

22. BEAM BALL — ładowana wiązka
- HP: 90.
- Ładuje przez 2 s, następnie strzela przez 1,5 s.
- Wiązka: 3 DMG co 0,15 s, maksymalnie 30 DMG na cel.
- Podczas strzelania obraca się maksymalnie o 35°/s.
- Odpoczynek po strzale: 3 s.
- Słabość: powolne śledzenie ruchomego przeciwnika.

23. BIG SPIKE BALL — duże kolce
- HP: 110.
- Odbicie tworzy przy ścianie kolec; CD: 0,8 s.
- Kolec: 9 DMG i odrzut, znika po trafieniu.
- Limit: 6; czas życia: 10 s.
- Słabość: brak presji w centrum.

24. BOW BALL — odbijające strzały
- HP: 95.
- Ładuje strzałę przez 1,2 s, odpoczywa 0,8 s po strzale.
- Strzała: 10 DMG.
- Odbija się maksymalnie 2 razy od ścian.
- Znika po trafieniu przeciwnika lub po 4 s.
- Słabość: mała częstotliwość strzałów.

25. CANNON BALL — wieżyczki
- HP: 95.
- Odbicie tworzy wieżyczkę; CD: 2 s.
- Wieżyczka strzela pociskiem za 2 DMG co 1 s.
- Limit: 3; czas życia: 8 s.
- Wieżyczka ma 8 HP i może zostać zniszczona.
- Słabość: potrzebuje rozstawienia.

26. ELECTRO KING — sieć elektryczna
- HP: 100.
- Odbicia zostawiają węzły; CD: 1 s.
- Kolejne węzły łączy elektryczna linia.
- Linie: 3 DMG co 0,5 s przy kontakcie.
- Wspólny odstęp obrażeń sieci na cel: 0,5 s.
- Limit: 4 węzły; czas życia węzła: 7 s.
- Słabość: wynik zależy od rozmieszczenia węzłów.

27. FROST BALL — mróz
- HP: 100.
- Co 3 s tworzy na swojej pozycji pole mrozu.
- Promień: 4; czas życia: 2 s.
- Pole: 2 DMG co 0,5 s i spowolnienie 25%.
- Po 1,5 s ciągłego przebywania zamraża na 0,4 s.
- Jedno zamrożenie na cel na pole.
- Słabość: cel może szybko opuścić obszar.

28. RANGE BALL — rosnąca aura
- HP: 100.
- Aura: 2 DMG co 0,5 s.
- Promień początkowy: 2,5.
- Co 4 s promień rośnie o 0,5, maksymalnie do 6.
- Słabość: mały zasięg na początku.

29. VIRUS BALL — zakażenie
- HP: 105.
- Kontakt: 2 DMG i stos trucizny.
- CD zakażenia na cel: 1 s.
- W 2v2 zakażony może przekazać jeden stos sojusznikowi
  przez kontakt, najwyżej raz na 2 s.
- Przekazany stos nie może rozprzestrzeniać się dalej.
- Słabość: obrażenia wymagają czasu.

30. WDC BALL — ponumerowane pola
- HP: 100.
- Dzieli arenę na siatkę 6 × 4.
- Pola otrzymują wartości 1–6, losowane ponownie co 4 s.
- Kontakt z przeciwnikiem zadaje 2 × wartość pola,
  na którym znajduje się środek WDC.
- Odstęp trafień: 0,8 s.
- Słabość: zależność od pozycji.

31. BOMB BALL — bomby
- HP: 100.
- Co 2 s pozostawia bombę.
- Zapalnik: 2 s; promień: 5.
- Wybuch: 12 DMG i odrzut.
- Limit: 3 bomby.
- Słabość: przeciwnik może oddalić się przed wybuchem.

32. CONDUCTOR BALL — pociąg
- HP: 100.
- Odbicie od ściany wyznacza prosty tor przez arenę.
- CD: 5 s.
- Po 0,8 s ostrzeżenia przejeżdża pociąg.
- Trafienie: 18 DMG i mocny odrzut.
- Jeden pociąg trafia dany cel maksymalnie raz.
- Słabość: czytelna, prosta trasa.

33. ACID BALL — kwas
- HP: 95.
- Co 2,5 s strzela pociskiem kwasu.
- Bezpośrednie trafienie: 4 DMG.
- W miejscu trafienia lub po 1 s lotu powstaje kałuża.
- Promień: 3; czas życia: 4 s; 3 DMG/s.
- Limit: 3 kałuże; ich DPS jednego właściciela nie sumuje się.
- Słabość: wymaga utrzymania celu w obszarze.

34. CACTUS BALL — odbijające kaktusy
- HP: 110.
- Co 2 s wypuszcza kaktus za 5 DMG.
- Kaktus odbija się do 3 razy od ścian.
- Znika po trafieniu przeciwnika lub po 5 s.
- Maksymalnie 5 aktywnych kaktusów.
- Słabość: brak naprowadzania.

35. FIBONACCI BALL — narastające obrażenia
- HP: 95.
- Kolejne trafienia ciałem zadają: 1, 1, 2, 3, 5, 8, 13, 21 DMG.
- Po 21 DMG sekwencja zaczyna się od nowa.
- Odstęp trafień: 0,8 s.
- Po 5 s bez trafienia cofa się o dwa miejsca w sekwencji.
- Słabość: słaby początek i utrata postępu.

36. HARPOON BALL — harpun
- HP: 105.
- Co 3,5 s strzela harpunem; zasięg: 15.
- Trafienie: 8 DMG.
- Przyciąga cel o maksymalnie 6 jednostek.
- Przez 0,7 s po trafieniu następne zderzenie z tym celem
  zadaje dodatkowe 5 DMG; tylko raz.
- Słabość: wąski pocisk.

37. HIVE BALL — rój
- HP: 90.
- Co 3 s wypuszcza 3 pszczoły.
- Pszczoła: 2 DMG, znika po trafieniu.
- Cały rój może nałożyć na jeden cel maksymalnie 1 stos trucizny.
- Pszczoły śledzą cel z ograniczoną szybkością skrętu.
- Czas życia: 3 s; limit: 6.
- Słabość: niskie HP właściciela.

38. POTION BALL — mikstury
- HP: 95.
- Co 3 s rzuca miksturę, wybieraną z tasowanej talii 3 typów.
- Ogień: jednorazowe 5 DMG i podpalenie.
- Lód: jednorazowe 5 DMG i spowolnienie 30% na 2 s.
- Leczenie: jednorazowe 8 HP dla siebie lub sojusznika.
- Strefa ma promień 3 i istnieje 3 s.
- Każdy cel otrzymuje efekt danej strefy tylko raz.
- Słabość: kolejność efektów jest zmienna.

39. RAY BALL — wieżyczki laserowe
- HP: 90.
- Odbicie tworzy wieżyczkę; CD: 2,5 s.
- Co 1,5 s wieżyczka pokazuje linię celowania przez 0,3 s,
  następnie strzela za 5 DMG.
- Celowanie zostaje zablokowane na początku ostrzeżenia.
- Limit: 2; czas życia: 8 s; HP wieżyczki: 8.
- Słabość: cel może zejść z linii.

40. SHACKLES BALL — kajdany
- HP: 100.
- Co 3 s zostawia pułapkę.
- Pułapka: 6 DMG i unieruchomienie na 0,6 s.
- Po zadziałaniu znika.
- Limit: 3; czas życia: 8 s.
- Respektuje odporność po kontroli tłumu.
- Słabość: niewielkie obrażenia bez kolejnych trafień.

41. SPEAR BALL — włócznia
- HP: 105.
- Włócznia ma hitbox długości 4 przed kulą.
- Zwykłe trafienie: 7 DMG, odstęp 0,7 s.
- Co 4 s wykonuje krótki pchnięty doskok:
  14 DMG zamiast 7 i silny odrzut.
- Doskok trafia dany cel tylko raz.
- Słabość: boki i tył pozostają odsłonięte.

42. VERITY BALL — rozwój po otrzymaniu obrażeń
- HP: 110.
- Kontakt: początkowo 4 DMG, odstęp 0,8 s.
- Co 15 faktycznie utraconych HP wykonuje losowanie:
  50% szansy na poziom.
- Poziom: +2 DMG kontaktowe i +5% prędkości.
- Maksymalnie 5 poziomów.
- Obrażenia w tarczę nie zwiększają licznika.
- Słabość: rozwój wymaga utraty zdrowia.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. NOWE AUTORSKIE POMYSŁY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

To propozycje do naszej gry, nie lista potwierdzonych kul z Roblox.

43. GRAVITY BALL — grawitacja
- HP: 100.
- Co 5 s tworzy na 2 s pole przyciągania, promień 8.
- Przyciąganie jest łagodne; nie blokuje ruchu.
- Na końcu pole zapada się: 12 DMG w promieniu 4.
- Ostrzeżenie finału: 0,5 s.
- Wygląd: ciemna kula z zakrzywionymi pierścieniami.
- Słabość: przeciwnik może wypaść z centrum przed zapadnięciem.

44. MIRROR BALL — odbijanie pocisków
- HP: 90.
- Co 4 s aktywuje lustrzaną osłonę na 0,8 s.
- Odbija maksymalnie 3 pociski za 70% ich bazowych obrażeń.
- Odbity pocisk nie może zostać odbity ponownie.
- Lasery, strefy i broń kontaktowa nie są odbijane.
- Własny atak: szklany pocisk za 4 DMG co 1 s.
- Wygląd: srebrna powierzchnia z błyskiem przy aktywacji.
- Słabość: walka przeciw kulom kontaktowym.

45. MAGNET BALL — magnetyczne przeciążenie
- HP: 105.
- Co 4 s oznacza najbliższego przeciwnika na 2 s.
- W promieniu 10 przyciąga go słabą siłą.
- Następnie odpycha i zadaje 8 DMG, jeśli nadal jest w zasięgu.
- Kontakt podczas oznaczenia: 5 DMG, odstęp 0,8 s.
- Wygląd: czerwony i niebieski biegun.
- Słabość: samo oznaczenie nie gwarantuje obrażeń.

46. PORTAL BALL — portale
- HP: 90.
- Co 6 s tworzy na 3 s parę portali na przeciwległych ścianach.
- Portale przenoszą właściciela i jego pociski.
- Po teleportacji właściciel ma przez 1 s jedno uderzenie za 12 DMG.
- Własny pocisk: 4 DMG co 1,2 s.
- Ponowne wejście do portalu możliwe po 0,7 s.
- Wygląd: dwa wirujące kolory.
- Słabość: wyjście portalu jest widoczne.

47. ECHO BALL — powtórzenie trasy
- HP: 95.
- Co 4 s tworzy widmo odtwarzające ostatnie 2 s swojej trasy.
- Widmo: 7 DMG na kontakt, maksymalnie raz na cel.
- Główna kula: 4 DMG kontaktowe, odstęp 0,8 s.
- Widmo nie blokuje ruchu i znika po odtworzeniu.
- Wygląd: półprzezroczyste ślady ruchu.
- Słabość: echo atakuje dawną pozycję.

48. VOLCANO BALL — erupcja
- HP: 110; prędkość: 15.
- Co 4,5 s wyrzuca 5 brył lawy wachlarzem.
- Bryła: 4 DMG.
- Maksymalnie 2 bryły tej erupcji mogą trafić ten sam cel.
- Pierwsza trafiona bryła nakłada podpalenie.
- Wygląd: pęknięta skała i pomarańczowe wnętrze.
- Słabość: wolny ruch i przerwy między erupcjami.

49. SONIC BALL — fala dźwiękowa
- HP: 95.
- Co 3 s emituje rozszerzający się pierścień do promienia 9.
- Pierścień: 7 DMG i odrzut, jeden raz na cel.
- Może zniszczyć maksymalnie 3 wrogie pociski.
- Nie usuwa pułapek, laserów ani broni.
- Wygląd: membrana głośnika i widoczne fale.
- Słabość: umiarkowane obrażenia pojedynczego impulsu.

50. CHRONO BALL — spowolnienie czasu
- HP: 85.
- Co 6 s tworzy na 2 s pole o promieniu 6.
- Wrogie kule zwalniają w nim o 30%, pociski o 40%.
- Nie zmienia szybkości zadawania DOT ani cooldownów.
- Własny pocisk: 4 DMG co 0,8 s.
- Wygląd: tarcza zegara i obracające się wskazówki.
- Słabość: niskie HP i długi CD pola.

51. SHIELD BALL — taran z tarczą
- HP: 110; prędkość: 16.
- Otrzymuje tarczę 18 HP na starcie.
- Co 7 s odnawia ją do 18 HP; tarcze nie sumują się.
- Kontakt: 6 DMG, odstęp 0,8 s.
- Rozbicie tarczy emituje falę za 6 DMG w promieniu 4.
- Wygląd: opancerzona kula z sześciokątną osłoną.
- Słabość: mały zasięg i wolny ruch.

52. COMET BALL — kometa
- HP: 90; prędkość: 22.
- Co 4 s szarżuje po zapowiedzianej prostej.
- Szarża: 10 DMG, jeden raz na cel.
- Zostawia przez 2 s smugę zadającą 3 DMG/s.
- Nakładające się fragmenty smugi nie sumują obrażeń.
- Wygląd: jasny rdzeń i ogon cząsteczek.
- Słabość: przewidywalna trasa.

53. SEED BALL — roślinne pułapki
- HP: 100.
- Co 2,5 s pozostawia nasiono.
- Po 1,5 s nasiono wyrasta w roślinę z 6 HP.
- Roślina co 1,2 s strzela cierniem za 3 DMG.
- Limit: 3 rośliny; czas życia po wyrośnięciu: 7 s.
- Wygląd: zielona kula z pąkiem.
- Słabość: nasiona potrzebują czasu, rośliny są niszczalne.

54. PARRY BALL — kontratak
- HP: 95.
- Co 3 s przez 0,5 s przyjmuje pozycję parowania.
- Blokuje pierwsze trafienie pociskiem lub bronią kontaktową.
- Skuteczne parowanie uruchamia falę w stronę napastnika:
  10 DMG, zasięg 10.
- Zwykły atak: krótkie ostrze, 4 DMG, odstęp 0,7 s.
- Nie paruje DOT, stref ani wiązek ciągłych.
- Wygląd: stalowa kula z błyskiem ostrza.
- Słabość: krótki czas aktywnego parowania.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. WYMAGANIA WDROŻENIA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Dla każdej kuli przygotuj:
- identyfikator i nazwę;
- opis do menu w jednym zdaniu;
- HP, prędkość, rozmiar;
- parametry ataków i cooldownów;
- warunki aktywacji;
- czasy życia i limity obiektów;
- wygląd, animacje i dźwięki;
- mocną stronę i słabość;
- rzeczywistą logikę umiejętności.

Oddziel konfigurację od logiki.
Współdziel systemy pocisków, DOT, tarcz, leczenia, pułapek
i kontroli ruchu zamiast pisać je ponownie dla każdej kuli.

W grze sieciowej serwer rozstrzyga trafienia, HP, cooldowny
i losowania. Klient prezentuje efekty.

Nie pozwól, aby:
- jedna kolizja zadawała obrażenia wielokrotnie w jednej klatce;
- ogłuszenia blokowały przeciwnika bez końca;
- pułapki lub pomocnicy powstawali bez limitu;
- dzielenie kul prowadziło do nieskończonej liczby potomków;
- odbijane pociski wpadały w nieskończone odbijanie;
- obiekty z poprzedniej rundy pozostawały na arenie.

Przygotuj tryb testowy:
- wybór dwóch dowolnych kul;
- możliwość ustawienia ziarna losowości;
- podgląd hitboxów;
- log obrażeń według źródła;
- licznik leczenia, czasu kontroli i aktywnych obiektów;
- serię walk z różnymi kątami startowymi.

Balans traktuj jako punkt wyjścia.
Porównuj wyniki wielu walk, czas pokonania przeciwnika
i skuteczność w różnych zestawieniach.
Nie zwiększaj mocy tylko dlatego, że kula ma wyższą rzadkość.
Każda kula ma posiadać rozpoznawalną mechanikę i realną słabość.
```