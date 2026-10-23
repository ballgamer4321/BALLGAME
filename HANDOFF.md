# Wznowienie — Orbita: Starcie

Etapy 1–6 DONE, po nich dodatkowe poprawki wyboru kulek i ekranu startowego. Etap 7 TODO; zgodnie z poleceniem użytkownika tylko jeden etap na wiadomość, więc rozpocznij etap 7 dopiero po nowym „kontynuuj”. Projekt jest w C:\Users\antre\Desktop\ball game. Brak repo Git.

Działa lokalny pojedynek, multiplayer 1v1/2v2, trening z jawnie oznaczonym botem, osiem kulek ze zdolnościami, wybór z trzech ofert i raz z kolekcji na mecz, celowanie, rundy/rewanż, token powrotu w 30 s oraz sprzątanie pokoi. Mapa jest kwadratowa 20×20; arena, kulki i ekran wyboru zostały powiększone. Po utracie HP pojawia się dymek obrażeń; widoczny zegar usunięto.

Uruchomienie w osobnych terminalach z katalogu projektu:
- node node_modules/tsx/dist/cli.mjs src/server/index.ts
- node node_modules/vite/bin/vite.js --host 127.0.0.1
Adres: http://127.0.0.1:5173/. Oba procesy działają w bieżącej sesji, ale mogą wygasnąć po jej zakończeniu.
Testy: node node_modules/vitest/vitest.mjs run
Typy: node node_modules/typescript/bin/tsc --noEmit
Build: node node_modules/vite/bin/vite.js build
Polecenie npm może być niedostępne w PATH; używaj powyższych komend node.

Kluczowe pliki: PROJECT_SPEC.md (zasady i kryteria), src/simulation/world.ts (drużyny, fizyka, moce), src/server/rooms.ts (tryby, rundy, timeouty, walkower), src/server/network.ts (WebSocket i token sesji), src/client/main.ts i src/client/network.ts (HUD, wybór, UI sieciowe), src/client/arena.ts i src/client/style.css (render i układ). Testy scenariuszy są w tests/.

Ostatnia ukończona czynność: pełnoekranowe menu trybów i przeniesienie lobby oraz lokalnego wyboru kulek na arenę; usunięto boczne panele. Duże karty trybów pozwalają wybrać 1v1, 2v2, bota lub grę lokalną bez szukania panelu. Sieciowy wybór nadal pokazuje trzy losowe karty lub raz na mecz wszystkie dostępne kulki oraz kierunek. Usunięto automatyczny wybór kulki po 15 s i kierunku po 10 s — runda czeka na graczy, poza dotychczasowym 30-sekundowym limitem powrotu po rozłączeniu. W przeglądarce sprawdzono menu, lokalny wybór ośmiu kulek, lobby bota i ręczne potwierdzenie startu walki. 32/32 testy, typy i build przeszły; serwer zrestartowano.

Niedokończone zmiany: brak. Ograniczenia: ostrzeżenie bundlera o ok. 534 kB JS; brak testu pełnego meczu 2v2 do rewanżu i produkcyjnej wersji na fizycznym telefonie; trwały zapis posiadanych kulek i hosting czekają na etapy 8–9.

Najbliższe działania po nowym „kontynuuj”:
1. Rozpocząć etap 7: sprawdzić układ i czytelność na wąskich ekranach oraz sterowanie dotykowe.
2. Dopracować animacje, materiały, światło, efekty i dźwięki; dodać wyciszenie.
3. Dodać ograniczenie efektów i zweryfikować wydajność desktop/mobile.
4. Uruchomić odpowiednie testy i obejrzeć wersję w przeglądarce.
5. Zaktualizować PROGRESS.md i HANDOFF.md, zatrzymać się po etapie 7.
