export const COSMETICS = [
  { id: 'aurora', name: 'Aurora', description: 'Miętowy odcień kulki.', color: '#8df2ca', cost: 0 },
  { id: 'solar', name: 'Rozbłysk', description: 'Złoty odcień kulki.', color: '#ffc66e', cost: 25 },
  { id: 'nebula', name: 'Mgławica', description: 'Fioletowy odcień kulki.', color: '#c3a0fa', cost: 50 },
] as const;

export type CosmeticId = typeof COSMETICS[number]['id'];
export type MatchOutcome = 'win' | 'draw' | 'loss';
export const MATCH_REWARDS: Record<MatchOutcome, number> = { win: 20, draw: 10, loss: 8 };

export function rewardForOutcome(outcome: MatchOutcome) { return MATCH_REWARDS[outcome]; }

export interface ProgressRecord {
  version: 1;
  coins: number;
  matches: number;
  wins: number;
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
    version: 1, coins: 0, matches: 0, wins: 0,
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
  const equippedCosmetic = typeof raw.equippedCosmetic === 'string' && ownedCosmetics.includes(raw.equippedCosmetic as CosmeticId)
    ? raw.equippedCosmetic as CosmeticId : 'aurora';
  const processedMatches = raw.processedMatches && typeof raw.processedMatches === 'object'
    ? Object.fromEntries(Object.entries(raw.processedMatches as Record<string, unknown>)
      .filter(([id, claimed]) => /^[a-zA-Z0-9_-]{1,80}$/.test(id) && claimed === true)
      .slice(-256).map(([id]) => [id, true as const]))
    : {};
  return {
    version: 1,
    coins: finiteCount(raw.coins), matches: finiteCount(raw.matches), wins: finiteCount(raw.wins),
    ownedCosmetics, equippedCosmetic, processedMatches,
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

export function equipCosmetic(progress: ProgressRecord, cosmeticId: string, now = Date.now()): ProgressRecord {
  const current = normalizeProgress(progress, now);
  if (!COSMETICS.some(item => item.id === cosmeticId) || !current.ownedCosmetics.includes(cosmeticId as CosmeticId)) {
    throw new ProgressError('Najpierw odblokuj ten kosmetyk', 409);
  }
  return { ...current, equippedCosmetic: cosmeticId as CosmeticId, updatedAt: now };
}
