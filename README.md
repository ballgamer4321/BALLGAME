# Orbita: Starcie

Autorska przeglądarkowa gra z automatycznymi pojedynkami kulek. Działa gra lokalna, sieciowe 1v1 i 2v2 oraz trening z botem. Na pełnoekranowym menu wybiera się tryb, a w sieciowym meczu każdy gracz zatwierdza jedną z trzech losowych kulek albo raz na mecz wybiera z dostępnej kolekcji oraz ustawia kierunek. Walka rusza po decyzjach wszystkich graczy. Osiem autorskich kulek ma odrębne moce, a utrata HP pojawia się w dymkach nad areną. Arena jest kwadratowa 20 × 20 i nie pokazuje licznika czasu; wewnętrzna dogrywka chroni tylko przed zablokowanym pojedynkiem. Zasady i parametry są własną interpretacją, nie statystykami Roblox.

## Uruchomienie

W dwóch terminalach w tym katalogu:

```powershell
node node_modules/tsx/dist/cli.mjs src/server/index.ts
node node_modules/vite/bin/vite.js --host 127.0.0.1
```

Otwórz [grę lokalną](http://127.0.0.1:5173/). Kliknij tryb na ekranie startowym. W grze lokalnej wybierz obie kulki, ustaw kierunek suwakiem albo przeciągnięciem po arenie, potem rozpocznij pojedynek. Na telefonie przyciski „Twoja kulka” i „Rywal” przełączają wybór; duży suwak służy do celowania dotykiem. Aby zagrać online na tym samym serwerze, jeden gracz tworzy pokój, drugi dołącza kodem lub linkiem, obaj potwierdzają gotowość i dokonują wyborów. Domyślny mecz trwa do trzech punktów i najwyżej dziewięć rund. `WINS_TO_MATCH=1` skraca próby testowe. Przyciski pod areną sterują wyciszeniem i jakością efektów; na wąskim ekranie włączają się lekkie efekty. Vite proxy kieruje `/ws` do serwera na porcie 3001; samo `vite preview` tego proxy nie zapewnia.

Przy pierwszym uruchomieniu zainstaluj zależności przez `pnpm install`. Testy i build:

```powershell
node node_modules/vitest/vitest.mjs run
node node_modules/typescript/bin/tsc --noEmit
node node_modules/vite/bin/vite.js build
node node_modules/tsx/dist/cli.mjs scripts/bench.ts
```

Symulacja i moce są w `src/simulation/world.ts`, parametry kulek w `src/shared/config.ts`, logika meczów w `src/server/rooms.ts`, a grafika w `src/client/arena.ts`. Szczegółowy zakres i źródła: [PROJECT_SPEC.md](PROJECT_SPEC.md). Stan projektu i dalsze kroki: [PROGRESS.md](PROGRESS.md), [HANDOFF.md](HANDOFF.md).

Gra działa lokalnie. Klient jest też publicznie dostępny na [Vercel](https://ballgame-tawny.vercel.app/); tryby sieciowe czekają na osobny serwer WebSocket. Trwały postęp i integracja reklam należą do następnego etapu. Test wizualny na fizycznym telefonie oraz pomiar FPS WebGL nie zostały jeszcze wykonane.

## Wdrożenie

`vercel.json` buduje klienta Vite do `dist`. Serwer pokojów w `src/server/network.ts` utrzymuje stan w pamięci procesu Node.js i potrzebuje działającego serwera WebSocket. Dla hostingu klienta pod osobną domeną ustaw w projekcie Vercel `VITE_WS_URL=wss://ADRES_SERWERA/ws` przed buildem. Bez takiego serwera na Vercel działa gra lokalna, a tryby sieciowe i trening z botem są wyłączone. Sam build Vite nie jest potwierdzeniem działania multiplayera. Szczegóły są w `.env.example`.
