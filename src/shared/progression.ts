import { MATCH_BALLS } from './config';

export const COSMETICS = [
  { id: 'aurora', name: 'Aurora', description: 'Miętowy odcień kulki.', color: '#8df2ca', cost: 0 },
  { id: 'solar', name: 'Rozbłysk', description: 'Złoty odcień kulki.', color: '#ffc66e', cost: 25 },
  { id: 'nebula', name: 'Mgławica', description: 'Fioletowy odcień kulki.', color: '#c3a0fa', cost: 50 },
] as const;

export type CosmeticId = typeof COSMETICS[number]['id'];
export type BallId = typeof MATCH_BALLS[number]['id'];
export const STARTER_BALL_IDS: readonly BallId[] = ['jade', 'orange', 'pink'];
/** Katalog posiadany przez starsze profile, zanim nowe kulki trafiły do skrzynki. */
export const LEGACY_OWNED_BALL_IDS: readonly BallId[] = [
  'jade', 'steel', 'cyan', 'orange', 'pink', 'laser', 'cannon', 'spider', 'axe',
  'blade', 'burst', 'charge', 'glass', 'poison-spike', 'thief',
];

export const BALL_SHOP = MATCH_BALLS.map(ball => ({
  id: ball.id, name: ball.name, color: ball.color, ability: ball.ability,
  weakness: ball.weakness, trigger: ball.trigger,
}));

export const BALL_CRATE_COST = 300;

export type MatchOutcome = 'win' | 'draw' | 'loss';
export const MATCH_REWARDS: Record<MatchOutcome, number> = { win: 100, draw: 75, loss: 50 };

export function rewardForOutcome(outcome: MatchOutcome) { return MATCH_REWARDS[outcome]; }

export interface ProgressRecord {
  version: 2;
  coins: number;
  matches: number;
  wins: number;
  ownedBalls: BallId[];
  ownedCosmetics: CosmeticId[];
  equippedCosmetic: CosmeticId;
  processedMatches: Record<string, true>;
  createdAt: number;
  updatedAt: number;
}

export type PublicProgress = Omit<ProgressRecord, 'processedMatches' | 'version' | 'createdAt' | 'updatedAt'>;

export class ProgressError extends Error {
  constructor(message: string, readonly status = 400) { super(message); }
}

export function createProgress(now = Date.now()): ProgressRecord {
  return {
    version: 2, coins: 0, matches: 0, wins: 0,
    ownedBalls: [...STARTER_BALL_IDS],
    ownedCosmetics: ['aurora'], equippedCosmetic: 'aurora',
    processedMatches: {}, createdAt: now, updatedAt: now,
  };
}

export function normalizeProgress(value: unknown, now = Date.now()): ProgressRecord {
  const raw = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const validIds = new Set<string>(COSMETICS.map(item => item.id));
  const ownedCosmetics = Array.isArray(raw.ownedCosmetics)
    ? [...new Set(raw.ownedCosmetics.filter((id): id is CosmeticId => typeof id === 'string' && validIds.has(id)))]
    : [];
  if (!ownedCosmetics.includes('aurora')) ownedCosmetics.unshift('aurora');
  const validBallIds = new Set<string>(MATCH_BALLS.map(ball => ball.id));
  const storedBalls = Array.isArray(raw.ownedBalls)
    ? raw.ownedBalls.filter((id): id is BallId => typeof id === 'string' && validBallIds.has(id))
    : typeof raw.createdAt === 'number' && raw.createdAt > 0
      ? LEGACY_OWNED_BALL_IDS
      : [...STARTER_BALL_IDS];
  const ownedBalls = [...new Set<BallId>([...STARTER_BALL_IDS, ...storedBalls])];
  const equippedCosmetic = typeof raw.equippedCosmetic === 'string' && ownedCosmetics.includes(raw.equippedCosmetic as CosmeticId)
    ? raw.equippedCosmetic as CosmeticId : 'aurora';
  const processedMatches = raw.processedMatches && typeof raw.processedMatches === 'object'
    ? Object.fromEntries(Object.entries(raw.processedMatches as Record<string, unknown>)
      .filter(([id, claimed]) => /^[a-zA-Z0-9_-]{1,80}$/.test(id) && claimed === true)
      .slice(-256).map(([id]) => [id, true as const]))
    : {};
  return {
    version: 2,
    coins: finiteCount(raw.coins), matches: finiteCount(raw.matches), wins: finiteCount(raw.wins),
    ownedBalls, ownedCosmetics, equippedCosmetic, processedMatches,
    createdAt: finiteTime(raw.createdAt, now), updatedAt: finiteTime(raw.updatedAt, now),
  };
}

function finiteCount(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(1_000_000_000, Math.floor(value))) : 0;
}
function finiteTime(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

export function publicProgress(progress: ProgressRecord): PublicProgress {
  return {
    coins: progress.coins, matches: progress.matches, wins: progress.wins,
    ownedBalls: [...progress.ownedBalls],
    ownedCosmetics: [...progress.ownedCosmetics], equippedCosmetic: progress.equippedCosmetic,
  };
}

export function awardMatch(progress: ProgressRecord, matchId: string, outcome: MatchOutcome, now = Date.now()) {
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(matchId)) throw new ProgressError('Nieprawidłowy identyfikator meczu');
  const current = normalizeProgress(progress, now);
  if (current.processedMatches[matchId]) return { progress: current, awarded: 0, duplicate: true };
  const awarded = rewardForOutcome(outcome);
  const processedMatches = { ...current.processedMatches, [matchId]: true as const };
  const recentClaims = Object.fromEntries(Object.entries(processedMatches).slice(-256));
  return {
    progress: {
      ...current, coins: current.coins + awarded, matches: current.matches + 1,
      wins: current.wins + Number(outcome === 'win'),
      processedMatches: recentClaims, updatedAt: now,
    },
    awarded, duplicate: false,
  };
}

export function purchaseCosmetic(progress: ProgressRecord, cosmeticId: string, now = Date.now()): ProgressRecord {
  const current = normalizeProgress(progress, now);
  const cosmetic = COSMETICS.find(item => item.id === cosmeticId);
  if (!cosmetic) throw new ProgressError('Nie znaleziono kosmetyku');
  if (current.ownedCosmetics.includes(cosmetic.id)) throw new ProgressError('Ten kosmetyk jest już w kolekcji', 409);
  if (current.coins < cosmetic.cost) throw new ProgressError('Za mało monet', 409);
  return { ...current, coins: current.coins - cosmetic.cost, ownedCosmetics: [...current.ownedCosmetics, cosmetic.id], updatedAt: now };
}

export function openBallCrate(progress: ProgressRecord, randomValue: number, now = Date.now()) {
  const current = normalizeProgress(progress, now);
  const lockedBalls = BALL_SHOP.filter(ball => !current.ownedBalls.includes(ball.id));
  if (!lockedBalls.length) throw new ProgressError('Masz już wszystkie kulki.', 409);
  if (current.coins < BALL_CRATE_COST) throw new ProgressError(`Skrzynka kosztuje ${BALL_CRATE_COST} monet.`, 409);
  if (!Number.isFinite(randomValue) || randomValue < 0 || randomValue >= 1) throw new ProgressError('Nieprawidłowe losowanie.');
  const ball = lockedBalls[Math.floor(randomValue * lockedBalls.length)];
  const updated = {
    ...current,
    coins: current.coins - BALL_CRATE_COST,
    ownedBalls: [...current.ownedBalls, ball.id],
    updatedAt: now,
  };
  return { progress: updated, ball };
}

export function equipCosmetic(progress: ProgressRecord, cosmeticId: string, now = Date.now()): ProgressRecord {
  const current = normalizeProgress(progress, now);
  if (!COSMETICS.some(item => item.id === cosmeticId) || !current.ownedCosmetics.includes(cosmeticId as CosmeticId)) {
    throw new ProgressError('Najpierw odblokuj ten kosmetyk', 409);
  }
  return { ...current, equippedCosmetic: cosmeticId as CosmeticId, updatedAt: now };
}
