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
  { id: 'amber', name: 'Taran', color: '#ffb866', hp: 105, radius: 1.35, speed: 10.2, damage: 11, ability: 'Co 4 s przyspiesza na 0,7 s; następny kontakt +8 obrażeń.', trigger: 'czas' },
  { id: 'jade', name: 'Żmija', color: '#76dd9a', hp: 105, radius: 1.35, speed: 9.8, damage: 9, ability: 'Kontakt zatruwa: 3 obrażenia co sekundę przez 3 s.', trigger: 'kontakt' },
  { id: 'violet', name: 'Pryzmat', color: '#c3a0fa', hp: 95, radius: 1.35, speed: 11.0, damage: 10, ability: 'Odbicie od ściany wysyła promień za 7 obrażeń, co 3 s.', trigger: 'ściana' },
  { id: 'steel', name: 'Bastion', color: '#b8c9db', hp: 115, radius: 1.42, speed: 8.9, damage: 8, ability: 'Co 5 s tarcza pochłania 12 obrażeń przez 2 s.', trigger: 'czas' },
  { id: 'gold', name: 'Pulsar', color: '#ffe382', hp: 100, radius: 1.35, speed: 10.0, damage: 9, ability: 'Co 3 s fala trafia wroga w promieniu 6 za 12 obrażeń.', trigger: 'czas' },
  { id: 'cyan', name: 'Szron', color: '#82e9f4', hp: 105, radius: 1.35, speed: 10.3, damage: 9, ability: 'Co 3 s spowalnia wroga w promieniu 7 o 50% na 2,5 s i zadaje 6 obrażeń.', trigger: 'czas' },
  { id: 'orange', name: 'Siewca', color: '#ff9566', hp: 95, radius: 1.35, speed: 10.1, damage: 9, ability: 'Odbicie od ściany wypuszcza pocisk za 7 obrażeń, co 4 s.', trigger: 'ściana' },
  { id: 'pink', name: 'Echo', color: '#ff9dd5', hp: 100, radius: 1.35, speed: 10.4, damage: 9, ability: 'Co 6 s tworzy satelitę na 2 s; bliski wróg traci 8 HP.', trigger: 'czas' },
  { id: 'beam', name: 'Wiązka', color: '#48eaff', hp: 96, radius: 1.35, speed: 9.8, damage: 9, ability: 'Ładuje się, namierza wroga i przez sekundę tnie go wiązką.', trigger: 'czas' },
  { id: 'laser', name: 'Laser', color: '#f05cff', hp: 98, radius: 1.35, speed: 10.2, damage: 8, ability: 'Po odbiciu zostawia laserową barierę przecinającą arenę.', trigger: 'ściana' },
  { id: 'machine', name: 'Karabin', color: '#ff9ee8', hp: 92, radius: 1.32, speed: 10.8, damage: 8, ability: 'Co 1,15 s wysyła szybki pocisk w stronę najbliższego wroga.', trigger: 'czas' },
  { id: 'cannon', name: 'Salwa', color: '#ff745d', hp: 108, radius: 1.4, speed: 9.3, damage: 9, ability: 'Odbicie od ściany wystrzeliwuje wachlarz trzech pocisków.', trigger: 'ściana' },
  { id: 'spider', name: 'Pajęczak', color: '#a9f775', hp: 103, radius: 1.36, speed: 9.7, damage: 9, ability: 'Na ścianie rozkłada sieć, która rani i spowalnia przeciwnika.', trigger: 'ściana' },
  { id: 'axe', name: 'Topór', color: '#dce5f2', hp: 105, radius: 1.38, speed: 9.6, damage: 9, ability: 'Każdy punkt utraconego HP wzmacnia kontakt aż o 12 obrażeń.', trigger: 'HP' },
] as const;
