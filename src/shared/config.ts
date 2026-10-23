/** Własne parametry prototypu, nie statystyki Roblox. */
export const RULES = {
  width: 20, height: 20, step: 1 / 60,
  maxTicks: 45 * 60, overtimeTick: 30 * 60,
  contactRelease: 0.015, maxImpacts: 64,
} as const;

export const BASIC_BALLS = [
  { id: 'amber', name: 'Bursztyn', color: '#ffb866', hp: 100, radius: 1.15, speed: 7.5, damage: 10 },
  { id: 'jade', name: 'Jadeit', color: '#76ddd0', hp: 100, radius: 1.15, speed: 7.5, damage: 10 },
] as const;

/** Autorskie kulki i parametry balansu; nie pochodzą z Roblox. */
export const MATCH_BALLS = [
  { id: 'amber', name: 'Taran', color: '#ffb866', hp: 105, radius: 1.15, speed: 7.6, damage: 11, ability: 'Co 4 s przyspiesza na 0,7 s; następny kontakt +8 obrażeń.', trigger: 'czas' },
  { id: 'jade', name: 'Żmija', color: '#76dd9a', hp: 105, radius: 1.15, speed: 7.3, damage: 9, ability: 'Kontakt zatruwa: 3 obrażenia co sekundę przez 3 s.', trigger: 'kontakt' },
  { id: 'violet', name: 'Pryzmat', color: '#c3a0fa', hp: 95, radius: 1.15, speed: 8.2, damage: 10, ability: 'Odbicie od ściany wysyła promień za 7 obrażeń, co 3 s.', trigger: 'ściana' },
  { id: 'steel', name: 'Bastion', color: '#b8c9db', hp: 115, radius: 1.22, speed: 6.6, damage: 8, ability: 'Co 5 s tarcza pochłania 12 obrażeń przez 2 s.', trigger: 'czas' },
  { id: 'gold', name: 'Pulsar', color: '#ffe382', hp: 100, radius: 1.15, speed: 7.4, damage: 9, ability: 'Co 3 s fala trafia wroga w promieniu 6 za 12 obrażeń.', trigger: 'czas' },
  { id: 'cyan', name: 'Szron', color: '#82e9f4', hp: 105, radius: 1.15, speed: 7.7, damage: 9, ability: 'Co 3 s spowalnia wroga w promieniu 7 o 50% na 2,5 s i zadaje 6 obrażeń.', trigger: 'czas' },
  { id: 'orange', name: 'Siewca', color: '#ff9566', hp: 95, radius: 1.15, speed: 7.5, damage: 9, ability: 'Odbicie od ściany wypuszcza pocisk za 7 obrażeń, co 4 s.', trigger: 'ściana' },
  { id: 'pink', name: 'Echo', color: '#ff9dd5', hp: 100, radius: 1.15, speed: 7.8, damage: 9, ability: 'Co 6 s tworzy satelitę na 2 s; bliski wróg traci 8 HP.', trigger: 'czas' },
] as const;
