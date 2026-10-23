# Orbita: Starcie

Autorska przeglądarkowa gra z automatycznymi pojedynkami kulek. Działa trening lokalny oraz sieciowy mecz 1v1 z pokojami, wyborem jednej z trzech ofert, kierunkiem startowym, rundami i rewanżem. Osiem autorskich kulek ma odrębne moce, a utrata HP pojawia się w dymkach nad areną. Arena jest kwadratowa 20 × 20 i nie pokazuje licznika czasu; wewnętrzna dogrywka chroni tylko przed zablokowanym pojedynkiem. Zasady i parametry są własną interpretacją, nie statystykami Roblox.

## Uruchomienie

W dwóch terminalach w tym katalogu:

```powershell
node node_modules/tsx/dist/cli.mjs src/server/index.ts
node node_modules/vite/bin/vite.js --host 127.0.0.1
```

Otwórz [grę lokalną](http://127.0.0.1:5173/). W treningu wybierz obie kulki, ustaw kierunek suwakiem albo przeciągnięciem po arenie, potem rozpocznij pojedynek. Po wyniku przycisk przygotowuje następny pojedynek, żeby znów można było wybrać kierunek. Aby zagrać online na tym samym serwerze, jeden gracz tworzy pokój, drugi dołącza kodem lub linkiem, obaj potwierdzają gotowość i dokonują wyborów. Kierunek można zmieniać do zatwierdzenia. Domyślny mecz trwa do trzech punktów i najwyżej dziewięć rund. `WINS_TO_MATCH=1` skraca próby testowe. Vite proxy kieruje `/ws` do serwera na porcie 3001; samo `vite preview` tego proxy nie zapewnia.

Przy pierwszym uruchomieniu zainstaluj zależności przez `pnpm install`. Testy i build:

```powershell
node node_modules/vitest/vitest.mjs run
node node_modules/typescript/bin/tsc --noEmit
node node_modules/vite/bin/vite.js build
```

Symulacja i moce są w `src/simulation/world.ts`, parametry kulek w `src/shared/config.ts`, logika meczów w `src/server/rooms.ts`, a grafika w `src/client/arena.ts`. Szczegółowy zakres i źródła: [PROJECT_SPEC.md](PROJECT_SPEC.md). Stan projektu i dalsze kroki: [PROGRESS.md](PROGRESS.md), [HANDOFF.md](HANDOFF.md).

Gra działa lokalnie; nie jest jeszcze wdrożona publicznie. Tryb 2v2, powrót po rozłączeniu, bot treningowy, dźwięki i trwały postęp należą do późniejszych etapów.
