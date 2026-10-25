/** Własne parametry prototypu, nie statystyki Roblox. */
export const RULES = {
  width: 20, height: 20, step: 1 / 60,
  maxTicks: 45 * 60, overtimeTick: 30 * 60,
  contactRelease: 0.015, maxImpacts: 64,
} as const;

export const BASIC_BALLS = [
  { id: 'amber', name: 'Bursztyn', color: '#ffb866', hp: 100, radius: 1.35, speed: 10.1, damage: 10 },
  { id: 'jade', name: 'Jadeit', color: '#76ddd0', hp: 100, radius: 1.35, speed: 10.1, damage: 10 },
] as const;

/** Autorskie kulki i parametry balansu; nie pochodzą z Roblox. */
export const MATCH_BALLS = [
  { id: 'jade', name: 'Żmija', color: '#76dd9a', hp: 105, radius: 1.35, speed: 9.8, damage: 9, ability: 'Kontakt nakłada stos trucizny: 2 obrażenia/s przez 3 s, maks. 3 stosy.', trigger: 'kontakt', weakness: 'Musi utrzymać bliski kontakt, by nałożyć kolejne stosy.' },
  { id: 'steel', name: 'Bastion', color: '#b8c9db', hp: 115, radius: 1.42, speed: 8.9, damage: 8, ability: 'Co 5 s tarcza pochłania do 12 obrażeń przez 2 s.', trigger: 'czas', weakness: 'Wolniejszy i podatny po wygaśnięciu tarczy.' },
  { id: 'cyan', name: 'Szron', color: '#82e9f4', hp: 105, radius: 1.35, speed: 10.3, damage: 9, ability: 'Co 3 s rani w zasięgu 7 i spowalnia o 40% na 2,5 s.', trigger: 'czas', weakness: 'Moc ma długi odstęp i ograniczony zasięg.' },
  { id: 'orange', name: 'Siewca', color: '#ff9566', hp: 95, radius: 1.35, speed: 10.1, damage: 9, ability: 'Odbicie od ściany wypuszcza pocisk za 7 obrażeń, co 4 s.', trigger: 'ściana', weakness: 'Pocisk może chybić ruchomego celu.' },
  { id: 'pink', name: 'Echo', color: '#ff9dd5', hp: 100, radius: 1.35, speed: 10.4, damage: 9, ability: 'Co 6 s tworzy satelitę na 2 s; bliski wróg traci 8 HP.', trigger: 'czas', weakness: 'Satelita wymaga wejścia w krótki zasięg.' },
  { id: 'laser', name: 'Laser', color: '#f05cff', hp: 95, radius: 1.35, speed: 10.1, damage: 0, ability: 'Po uderzeniu w ścianę tworzy ostrzegawczą linię lasera długości 12; aktywna 4 s zadaje 6 obrażeń co 0,75 s.', trigger: 'ściana', weakness: 'Laser jest nieruchomy i trzeba go przeciąć.' },
  { id: 'cannon', name: 'Salwa', color: '#ff745d', hp: 108, radius: 1.4, speed: 9.3, damage: 9, ability: 'Odbicie od ściany wystrzeliwuje wachlarz trzech pocisków.', trigger: 'ściana', weakness: 'Rozproszony wachlarz łatwo ominąć z daleka.' },
  { id: 'spider', name: 'Pajęczak', color: '#a9f775', hp: 95, radius: 1.36, speed: 9.7, damage: 0, ability: 'Na ścianie rozkłada sieć: 2 obrażenia/s i 30% spowolnienia przez 6 s.', trigger: 'ściana', weakness: 'Sieć jest nieruchoma i zadaje obrażenia stopniowo.' },
  { id: 'axe', name: 'Topór', color: '#dce5f2', hp: 110, radius: 1.38, speed: 9.6, damage: 0, ability: 'Topór krąży i zadaje 12 obrażeń; obrót przyspiesza z 0,7 do 1,8 obr./s przy utracie HP.', trigger: 'obrót ostrza', weakness: 'Ostrze trafia tylko wycinek przestrzeni wokół kuli.' },
  { id: 'blade', name: 'Blade Ball', color: '#e9f2fa', hp: 100, radius: 1.3, speed: 10, damage: 0, ability: 'Zaczyna z jednym orbitującym ostrzem; co 4 s zyskuje kolejne, maks. 5. Ostrze zadaje 6 obrażeń.', trigger: 'rozwój', weakness: 'Ostrza mają krótki zasięg i potrzebują czasu, by się rozwinąć.' },
  { id: 'burst', name: 'Burst Ball', color: '#ffca77', hp: 100, radius: 1.35, speed: 10, damage: 0, ability: 'Co 3 s zapowiada szarżę przez 0,35 s, potem rusza prosto na 0,45 s; pierwszy kontakt zadaje 16 obrażeń.', trigger: 'co 3 s', weakness: 'Po starcie szarży nie może zmienić kierunku.' },
  { id: 'charge', name: 'Charge Ball', color: '#91b8ff', hp: 110, radius: 1.4, speed: 9, damage: 0, ability: 'Kontakt zadaje 4 obrażenia plus 3 za każdą pełną sekundę ładowania, maks. 25; trafienie zeruje ładunek.', trigger: 'kontakt', weakness: 'Częste trafienia resetują ładowanie.' },
  { id: 'glass', name: 'Glass Ball', color: '#b7f2ed', hp: 80, radius: 1.25, speed: 10.5, damage: 0, ability: 'Co 1,2 s po uderzeniu w ścianę lub przeciwnika rozsypuje 6 odłamków; każdy zadaje 3 obrażenia.', trigger: 'zderzenie', weakness: 'Ma tylko 80 HP; najwyżej 3 odłamki z jednej eksplozji ranią ten sam cel.' },
  { id: 'machine-gun', name: 'Machine Gun Ball', color: '#ff9ee8', hp: 90, radius: 1.3, speed: 10, damage: 0, ability: 'Strzela niekierowanymi pociskami za 2 obrażenia co 0,2 s; po 15 strzałach przeładowuje się 1,5 s.', trigger: 'automatyczny ostrzał', weakness: 'Szybkie pociski mogą chybić, a przeładowanie przerywa ostrzał.' },
  { id: 'poison-spike', name: 'Poison Spike Ball', color: '#8fd174', hp: 100, radius: 1.35, speed: 9.8, damage: 0, ability: 'Odbicie od ściany zostawia kolec: 4 obrażenia i stos trucizny; maks. 8 kolców po 12 s.', trigger: 'ściana', weakness: 'Kolce wymagają, by przeciwnik wrócił pod ścianę.' },
  { id: 'thief', name: 'Thief Ball', color: '#d7a5f4', hp: 90, radius: 1.3, speed: 10.4, damage: 0, ability: 'Rzuca nożem za 5 obrażeń co 1,1 s; odstęp skraca się do 0,4 s przy 20% HP.', trigger: 'automatyczny rzut', weakness: 'Szybsze rzuty pojawiają się dopiero przy niskim HP.' },
  { id: 'vampire', name: 'Wampir', color: '#b64c71', hp: 90, radius: 1.3, speed: 10.1, damage: 0, ability: 'Przy kontakcie przyczepia się na 1,2 s i zadaje trzy impulsy po 3 obrażenia, lecząc się o faktycznie zabrane HP; odnowienie 4 s.', trigger: 'kontakt', weakness: 'Musi dosięgnąć przeciwnika i utrzymać go blisko.' },
  { id: 'cell', name: 'Komórka', color: '#75d88d', hp: 90, radius: 1.3, speed: 9.8, damage: 5, ability: 'Co 5 s rośnie o 8%, maksymalnie pięć razy. Po zniszczeniu dzieli się na dwie mniejsze kulki z 15 HP plus 2 HP za każdy wzrost.', trigger: 'wzrost i podział', weakness: 'Większy hitbox ułatwia trafienie.' },
  { id: 'chess', name: 'Szachy', color: '#e2d4af', hp: 100, radius: 1.35, speed: 9.7, damage: 0, ability: 'Co 5 s wraca do środka, pokazuje trasę jednej z figur przez 0,6 s i atakuje za 18 obrażeń.', trigger: 'co 5 s', weakness: 'Trasę ataku widać przed uderzeniem.' },
  { id: 'dice', name: 'Kostka', color: '#f0eee5', hp: 100, radius: 1.34, speed: 9.9, damage: 0, ability: 'Co 2 s zostawia kostkę z wynikiem 1–6. Kontakt rani za liczbę oczek i przerzuca kostkę; maksymalnie 5 przez 10 s.', trigger: 'co 2 s', weakness: 'Obrażenia zależą od losowego wyniku.' },
  { id: 'electric', name: 'Elektryczna', color: '#ffe46c', hp: 100, radius: 1.35, speed: 10.2, damage: 0, ability: 'Gotowy kontakt zadaje 8 obrażeń i ogłusza na 0,35 s; odnowienie 2,5 s.', trigger: 'kontakt', weakness: 'Po wyładowaniu nie zadaje obrażeń ciałem.' },
  { id: 'hook', name: 'Hak', color: '#c49a72', hp: 105, radius: 1.36, speed: 9.5, damage: 0, ability: 'Co 4 s rzuca hak na 12 jednostek. Trafienie zadaje 5 obrażeń, ciągnie cel po krótkiej orbicie i wyrzuca go za 7.', trigger: 'co 4 s', weakness: 'Chybiony hak zużywa całe odnowienie.' },
  { id: 'ice-cone', name: 'Lodowy Rozprysk', color: '#9de7fa', hp: 95, radius: 1.3, speed: 9.8, damage: 0, ability: 'Co 3 s zostawia bombę; po 1,5 s osiem odłamków zadaje po 4 obrażenia i spowalnia o 25% na 1 s.', trigger: 'co 3 s', weakness: 'Bomba daje przeciwnikowi czas na ucieczkę.' },
  { id: 'reforge', name: 'Reforge', color: '#ffb86b', hp: 100, radius: 1.35, speed: 9.9, damage: 0, ability: 'Pierwsze odbicie przyzywa krążącego pomocnika. Zaczyna od 3 obrażeń, a co 1,5 s wzmacnia atak o 1 aż do 11.', trigger: 'odbicie od ściany', weakness: 'Potrzebuje czasu na rozwój pomocnika.' },
] as const;
