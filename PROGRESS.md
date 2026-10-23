# Postęp — Orbita: Starcie

Aktualizacja: 2026-10-23. Obowiązuje jeden etap na wiadomość użytkownika. Etap 6 zakończony; wykonano dodatkowe poprawki wyboru kulek i ekranu startowego na prośbę użytkownika. Etap 7 zacząć dopiero po nowym „kontynuuj”.

| Etap | Status |
| --- | --- |
| 1. Referencja i specyfikacja | DONE |
| 2. Podstawowa symulacja i arena | DONE |
| 3. Multiplayer 1v1 | DONE |
| 4. Pełny przebieg meczu | DONE |
| 5. Zdolności i balans | DONE |
| 6. 2v2, boty i odporność sieci | DONE |
| 7. Oprawa i telefony | TODO |
| 8. Kolekcja i miejsca na reklamy | TODO |
| 9. Testy końcowe i wdrożenie | TODO |

Etap 6: pokoje 1v1, 2v2 i jawny trening z botem. W 2v2 cztery sloty tworzą dwie drużyny; sojusznicy odbijają się bez obrażeń, HP i punkty liczą się drużynowo. Bot automatycznie wybiera kulkę i kierunek. Token sesji pozwala wrócić w ciągu 30 s; później 1v1 kończy się walkowerem, a w 2v2 nieobecna kulka zostaje wyeliminowana bez ukrytego bota. Pokoje puste, porzucone i bezczynne są sprzątane. Widok areny jest większy, a wybór kulek ma karty z mocą i parametrami.

Poprawka wyboru: trójka losowych kulek lub jednorazowe wejście do wszystkich aktualnie dostępnych kulek jest wyświetlane na arenie. Każdy gracz osobno wybiera kulkę i kierunek; ekran pokazuje stan wyboru wszystkich uczestników, a po ostatnim potwierdzeniu serwer od razu uruchamia walkę. Dostępne kulki są obecnie testowo wszystkie; trwałe posiadanie powstanie w etapie 8.

Poprawka ekranu: usunięto boczne panele. Pełna szerokość ekranu mieści menu z dużymi przyciskami 1v1, 2v2, treningu z botem i gry lokalnej. Lobby oraz lokalny wybór kulek są na arenie; w lokalnym wyborze wszystkie osiem kart każdej strony widać bez osobnych przewijanych list na dużym ekranie. Sieciowy wybór pozostaje na arenie. Serwer nie przydziela już automatycznie kulki ani kierunku po 15/10 sekundach: mecz czeka na decyzje graczy. Rozłączenia nadal obsługuje okno powrotu 30 s.

Weryfikacja: 32/32 testy, tsc --noEmit i build Vite przeszły po zmianie ekranu i usunięciu automatycznego wyboru. Test sieciowy sprawdza cztery osobne klienty WebSocket, wybór i wspólny stan walki. Test serwera potwierdza, że po 20 s fazy wyboru i 20 s celowania mecz wciąż czeka na graczy. W przeglądarce obejrzano pełnoekranowe menu, lokalny wybór ośmiu kulek, lobby treningu z botem i wybór trzech propozycji; potwierdzenie uruchomiło walkę. W poprzedniej weryfikacji dwa niezależne okna potwierdziły wybór z kolekcji (8 kulek), oczekiwanie na rywala i wspólny start walki. Serwer WebSocket i Vite działają lokalnie pod http://127.0.0.1:5173/.

Znane ograniczenia: brak trwałego zapisu kolekcji, dźwięków, pełnej oprawy mobilnej i publicznego hostingu — to kolejne etapy. Build zgłasza ostrzeżenie o paczce JS ok. 534 kB. Nie wykonano jeszcze pełnego testu produkcyjnej wersji na telefonie ani całego meczu 2v2 do rewanżu. Katalog nie jest repozytorium Git.

Następny krok po nowym „kontynuuj”: rozpocząć etap 7 od przeglądu oprawy na komputerze i małym ekranie, następnie animacje/dźwięki, dotyk, wyciszenie oraz ograniczenie efektów; sprawdzić wydajność i czytelność.
