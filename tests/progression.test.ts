import { expect, it } from 'vitest';
import { awardMatch, BALL_CRATE_COST, BALL_SHOP, createProgress, equipCosmetic, normalizeProgress, openBallCrate, purchaseCosmetic, rewardForOutcome, STARTER_BALL_IDS } from '../src/shared/progression';
import { MATCH_BALLS } from '../src/shared/config';
import { adsProvider } from '../src/client/ads';
import { progressIdForToken } from '../api/profile';

it('grants match currency once per server match id', () => {
  expect([rewardForOutcome('win'), rewardForOutcome('draw'), rewardForOutcome('loss')]).toEqual([100, 75, 50]);
  const first = awardMatch(createProgress(1), 'match_123', 'win', 2);
  expect(first.awarded).toBe(100);
  expect(first.progress).toMatchObject({ coins: 100, matches: 1, wins: 1 });
  const retry = awardMatch(first.progress, 'match_123', 'loss', 3);
  expect(retry.duplicate).toBe(true);
  expect(retry.awarded).toBe(0);
  expect(retry.progress).toMatchObject({ coins: 100, matches: 1, wins: 1 });
});

it('allows buying and equipping only owned cosmetics with earned coins', () => {
  let progress = createProgress(1);
  expect(() => purchaseCosmetic(progress, 'solar', 2)).toThrow('Za mało monet');
  progress = awardMatch(progress, 'match_1', 'win', 3).progress;
  progress = awardMatch(progress, 'match_2', 'draw', 4).progress;
  progress = purchaseCosmetic(progress, 'solar', 5);
  expect(progress.coins).toBe(150);
  expect(progress.ownedCosmetics).toContain('solar');
  expect(equipCosmetic(progress, 'solar', 6).equippedCosmetic).toBe('solar');
  expect(() => equipCosmetic(progress, 'nebula', 7)).toThrow('Najpierw odblokuj');
});

it('opens a 300-coin crate for one random locked ball without duplicates', () => {
  let progress = createProgress(1);
  expect(progress.ownedBalls).toEqual(STARTER_BALL_IDS);
  expect(BALL_CRATE_COST).toBe(300);
  for (let match = 0; match < 3; match++) progress = awardMatch(progress, `crate_win_${match}`, 'win', 2 + match).progress;
  expect(progress.coins).toBe(300);
  const lockedBefore = BALL_SHOP.filter(ball => !progress.ownedBalls.includes(ball.id));
  const first = openBallCrate(progress, 0.5, 6);
  expect(first.progress.coins).toBe(0);
  expect(first.progress.ownedBalls).toContain(first.ball.id);
  expect(first.ball.id).toBe(lockedBefore[Math.floor(0.5 * lockedBefore.length)].id);
  const second = openBallCrate({ ...first.progress, coins: BALL_CRATE_COST }, 0.5, 7);
  expect(second.ball.id).not.toBe(first.ball.id);
  expect(() => openBallCrate(createProgress(1), 0, 8)).toThrow('kosztuje 300');
  expect(() => openBallCrate({ ...second.progress, ownedBalls: BALL_SHOP.map(ball => ball.id), coins: 300 }, 0, 9)).toThrow('wszystkie kulki');
  expect(() => openBallCrate({ ...second.progress, coins: 300 }, 1, 10)).toThrow('Nieprawidłowe losowanie');
});

it('sanitizes stored profile fields and cosmetic ownership', () => {
  const profile = normalizeProgress({
    coins: -4, matches: 3.8, wins: 2, ownedCosmetics: ['aurora', 'invalid'],
    ownedBalls: ['steel', 'invalid'],
    equippedCosmetic: 'invalid', processedMatches: { 'valid-id': true, 'bad/id': true, wrong: 'yes' },
  }, 10);
  expect(profile).toMatchObject({ coins: 0, matches: 3, wins: 2, equippedCosmetic: 'aurora' });
  expect(profile.ownedCosmetics).toEqual(['aurora']);
  expect(profile.ownedBalls).toEqual([...STARTER_BALL_IDS, 'steel']);
  expect(profile.processedMatches).toEqual({ 'valid-id': true });
});

it('migrates existing profiles without ball inventory without removing their collection', () => {
  const migrated = normalizeProgress({ version: 1, createdAt: 1 }, 10);
  expect(new Set(migrated.ownedBalls)).toEqual(new Set(MATCH_BALLS.map(ball => ball.id)));
});

it('removes retired ball ownership and shop entries while preserving available starters', () => {
  const retired = ['beam', 'violet', 'amber', 'machine', 'gold'];
  const profile = normalizeProgress({ createdAt: 1, ownedBalls: retired }, 10);
  expect(profile.ownedBalls).toEqual(STARTER_BALL_IDS);
  expect(BALL_SHOP.some(ball => retired.includes(ball.id))).toBe(false);
  expect(MATCH_BALLS.some(ball => retired.includes(ball.id))).toBe(false);
});

it('keeps profile tokens out of database paths and handles invalid tokens', () => {
  const token = 'a'.repeat(48);
  const id = progressIdForToken(token);
  expect(id).toMatch(/^[a-f0-9]{64}$/);
  expect(id).not.toBe(token);
  expect(progressIdForToken('b'.repeat(48))).not.toBe(id);
  expect(() => progressIdForToken('short')).toThrow('Nieprawidłowy profil');
});

it('keeps ad placements inert when no provider is configured', async () => {
  expect(adsProvider.isAvailable()).toBe(false);
  await expect(adsProvider.showInterstitial()).resolves.toBe(false);
  await expect(adsProvider.showRewarded()).resolves.toBe(false);
});
