import { expect, it } from 'vitest';
import { awardMatch, createProgress, equipCosmetic, normalizeProgress, purchaseCosmetic, rewardForOutcome } from '../src/shared/progression';
import { adsProvider } from '../src/client/ads';
import { progressIdForToken } from '../api/profile';

it('grants match currency once per server match id', () => {
  expect([rewardForOutcome('win'), rewardForOutcome('draw'), rewardForOutcome('loss')]).toEqual([20, 10, 8]);
  const first = awardMatch(createProgress(1), 'match_123', 'win', 2);
  expect(first.awarded).toBe(20);
  expect(first.progress).toMatchObject({ coins: 20, matches: 1, wins: 1 });
  const retry = awardMatch(first.progress, 'match_123', 'loss', 3);
  expect(retry.duplicate).toBe(true);
  expect(retry.awarded).toBe(0);
  expect(retry.progress).toMatchObject({ coins: 20, matches: 1, wins: 1 });
});

it('allows buying and equipping only owned cosmetics with earned coins', () => {
  let progress = createProgress(1);
  expect(() => purchaseCosmetic(progress, 'solar', 2)).toThrow('Za mało monet');
  progress = awardMatch(progress, 'match_1', 'win', 3).progress;
  progress = awardMatch(progress, 'match_2', 'draw', 4).progress;
  progress = purchaseCosmetic(progress, 'solar', 5);
  expect(progress.coins).toBe(5);
  expect(progress.ownedCosmetics).toContain('solar');
  expect(equipCosmetic(progress, 'solar', 6).equippedCosmetic).toBe('solar');
  expect(() => equipCosmetic(progress, 'nebula', 7)).toThrow('Najpierw odblokuj');
});

it('sanitizes stored profile fields and cosmetic ownership', () => {
  const profile = normalizeProgress({
    coins: -4, matches: 3.8, wins: 2, ownedCosmetics: ['aurora', 'invalid'],
    equippedCosmetic: 'invalid', processedMatches: { 'valid-id': true, 'bad/id': true, wrong: 'yes' },
  }, 10);
  expect(profile).toMatchObject({ coins: 0, matches: 3, wins: 2, equippedCosmetic: 'aurora' });
  expect(profile.ownedCosmetics).toEqual(['aurora']);
  expect(profile.processedMatches).toEqual({ 'valid-id': true });
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
