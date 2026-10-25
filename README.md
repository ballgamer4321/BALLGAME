# Orbita: Starcie

Autorska przeglądarkowa gra z automatycznymi pojedynkami kulek. Działa gra lokalna, sieciowe 1v1 i 2v2 oraz trening z botem. Przygotowanie meczu ma dwa osobne kroki: wybór kulki, a potem ustawienie kierunku. W sieciowym meczu każdy zatwierdza jedną z trzech losowych kulek albo raz na mecz wybiera z dostępnej kolekcji; kierunek wybiera po zakończeniu wyboru przez wszystkich graczy. Osiem autorskich kulek ma odrębne moce, a utrata HP pojawia się w dymkach nad areną. Arena jest kwadratowa 20 × 20 i nie pokazuje licznika czasu; wewnętrzna dogrywka chroni tylko przed zablokowanym pojedynkiem. Zasady i parametry są własną interpretacją, nie statystykami Roblox.

## Uruchomienie

W dwóch terminalach w tym katalogu:

```powershell
node node_modules/tsx/dist/cli.mjs src/server/index.ts
node node_modules/vite/bin/vite.js --host 127.0.0.1
```

Otwórz [grę lokalną](http://127.0.0.1:5173/). Kliknij tryb na ekranie startowym. W grze lokalnej wybierz obie kulki i kliknij „Dalej: ustaw kierunek”. Na kolejnym ekranie wskaż tor jedną z ośmiu strzałek albo przeciągnij po kompasie, a potem rozpocznij pojedynek. Na telefonie przyciski „Twoja kulka” i „Rywal” przełączają wybór; kompas służy do celowania dotykiem. Aby zagrać online na tym samym serwerze, jeden gracz tworzy pokój, drugi dołącza kodem lub linkiem, obaj potwierdzają gotowość, wybierają kulki, a następnie ustawiają kierunek. Domyślny mecz trwa do trzech punktów i najwyżej dziewięć rund. `WINS_TO_MATCH=1` skraca próby testowe. Przyciski pod areną sterują wyciszeniem i jakością efektów; na wąskim ekranie włączają się lekkie efekty. Vite proxy kieruje `/ws` do serwera na porcie 3001; samo `vite preview` tego proxy nie zapewnia.

Przy pierwszym uruchomieniu zainstaluj zależności przez `pnpm install`. Testy i build:

```powershell
node node_modules/vitest/vitest.mjs run
node node_modules/typescript/bin/tsc --noEmit
node node_modules/vite/bin/vite.js build
node node_modules/tsx/dist/cli.mjs scripts/bench.ts
```

Symulacja i moce są w `src/simulation/world.ts`, parametry kulek w `src/shared/config.ts`, logika meczów w `src/server/rooms.ts`, a grafika w `src/client/arena.ts`. Szczegółowy zakres i źródła: [PROJECT_SPEC.md](PROJECT_SPEC.md). Stan projektu i dalsze kroki: [PROGRESS.md](PROGRESS.md), [HANDOFF.md](HANDOFF.md).

Gra działa lokalnie. Klient jest też publicznie dostępny na [Vercel](https://ballgame-tawny.vercel.app/). Hostowane 1v1 korzysta z funkcji `/api/room` i wspólnego stanu pokoi w Firebase Realtime Database. Tryby 2v2 i trening z botem nadal działają na lokalnym serwerze WebSocket. Trwały postęp i integracja reklam należą do następnego etapu. Test wizualny na fizycznym telefonie oraz pomiar FPS WebGL nie zostały jeszcze wykonane.

## Wdrożenie

`vercel.json` buduje klienta Vite do `dist`, a `api/room.ts` obsługuje hostowane pokoje 1v1. Funkcja używa `FIREBASE_DATABASE_URL` i tajnej zmiennej `FIREBASE_SERVICE_ACCOUNT_JSON` (lokalnie może też korzystać z `GOOGLE_APPLICATION_CREDENTIALS`). Klucz Admin SDK należy tylko do konfiguracji serwera; reguły bazy odmawiają bezpośredniego odczytu i zapisu przez przeglądarkę. Dwie przeglądarki wymieniają wybory i wynik przez API; każda płynnie odtwarza deterministyczną walkę pomiędzy synchronizacjami. Bez konfiguracji bazy przycisk 1v1 pozostaje wyłączony. Lokalny serwer w `src/server/network.ts` nadal obsługuje WebSocket, 2v2 i trening z botem. Opcjonalne `VITE_WS_URL` może skierować klienta do osobnego serwera WebSocket. Szczegóły są w `.env.example`.
Po najnowszej poprawce kulki są większe i poruszają się szybciej; kierunek ustawisz strzałkami na kompasie albo przeciągniesz palcem po kompasie, a strzałka pokaże tor startowy na arenie.
