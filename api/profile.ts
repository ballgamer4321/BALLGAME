import { createHash, randomInt } from 'node:crypto';
import { firebaseConfigured, firebaseDatabase } from './firebase.js';
import {
  awardMatch, createProgress, equipCosmetic, normalizeProgress, ProgressError,
  publicProgress, purchaseCosmetic, openBallCrate, type MatchOutcome, type ProgressRecord,
} from '../src/shared/progression.js';

const PROFILE_TOKEN = /^[a-f0-9]{48}$/;
const PROFILE_ID = /^[a-f0-9]{64}$/;

interface ProfileReference {
  transaction(update: (current: unknown) => ProgressRecord | undefined,
    onComplete?: undefined, applyLocally?: boolean): Promise<{ committed: boolean }>;
}

export function progressIdForToken(token: string) {
  if (!PROFILE_TOKEN.test(token)) throw new ProgressError('Nieprawidłowy profil');
  return createHash('sha256').update(token).digest('hex');
}

function reference(profileId: string) {
  if (!PROFILE_ID.test(profileId)) throw new ProgressError('Nieprawidłowy profil');
  return (firebaseDatabase() as unknown as { ref(path: string): ProfileReference }).ref(`orbita/profiles/${profileId}`);
}

async function transactProgress(profileId: string, change: (current: ProgressRecord) => ProgressRecord) {
  const ref = reference(profileId);
  let updated: ProgressRecord | undefined;
  let failure: unknown;
  const result = await ref.transaction(value => {
    updated = undefined;
    failure = undefined;
    try {
      updated = change(value ? normalizeProgress(value) : createProgress());
      return updated;
    } catch (error) {
      failure = error;
      return undefined;
    }
  }, undefined, false);
  if (failure) throw failure;
  if (!result.committed || !updated) throw new Error('Nie udało się zapisać profilu');
  return updated;
}

async function transactBallCrate(profileId: string) {
  const ref = reference(profileId);
  let opened: ReturnType<typeof openBallCrate> | undefined;
  let failure: unknown;
  const result = await ref.transaction(value => {
    opened = undefined;
    failure = undefined;
    try {
      opened = openBallCrate(value ? normalizeProgress(value) : createProgress(), randomInt(0, 2 ** 32) / 2 ** 32);
      return opened.progress;
    } catch (error) {
      failure = error;
      return undefined;
    }
  }, undefined, false);
  if (failure) throw failure;
  if (!result.committed || !opened) throw new Error('Nie udało się otworzyć skrzynki');
  return opened;
}

export async function ensureProgress(profileId: string) {
  return transactProgress(profileId, current => current);
}

export async function awardProgressMatch(profileId: string, matchId: string, outcome: MatchOutcome) {
  const ref = reference(profileId);
  let awarded = 0;
  let failure: unknown;
  const result = await ref.transaction(value => {
    failure = undefined;
    try {
      const reward = awardMatch(value ? normalizeProgress(value) : createProgress(), matchId, outcome);
      awarded = reward.awarded;
      return reward.progress;
    } catch (error) {
      failure = error;
      return undefined;
    }
  }, undefined, false);
  if (failure) throw failure;
  if (!result.committed) throw new Error('Nie udało się zapisać nagrody');
  return awarded;
}

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

export function GET() {
  return json({ online: firebaseConfigured() });
}

export async function POST(request: Request) {
  try {
    if (!firebaseConfigured()) return json({ error: 'Zapis profilu jest chwilowo niedostępny.' }, 503);
    const body = await request.text();
    if (body.length > 2048) return json({ error: 'Wiadomość jest za długa.' }, 413);
    const action = JSON.parse(body) as { type?: unknown; token?: unknown; cosmeticId?: unknown };
    if (typeof action.type !== 'string' || typeof action.token !== 'string') throw new ProgressError('Nieprawidłowa wiadomość');
    const profileId = progressIdForToken(action.token);
    let progress: ProgressRecord;
    let reward: ReturnType<typeof openBallCrate>['ball'] | undefined;
    if (action.type === 'load') progress = await ensureProgress(profileId);
    else if (action.type === 'purchase' && typeof action.cosmeticId === 'string') {
      progress = await transactProgress(profileId, current => purchaseCosmetic(current, action.cosmeticId as string));
    } else if (action.type === 'open-crate') {
      const opened = await transactBallCrate(profileId);
      progress = opened.progress;
      reward = opened.ball;
    } else if (action.type === 'equip' && typeof action.cosmeticId === 'string') {
      progress = await transactProgress(profileId, current => equipCosmetic(current, action.cosmeticId as string));
    } else throw new ProgressError('Nieprawidłowa akcja profilu');
    return json({ profile: publicProgress(progress), ...(reward ? { ball: reward } : {}) });
  } catch (error) {
    if (error instanceof ProgressError) return json({ error: error.message }, error.status);
    if (error instanceof SyntaxError) return json({ error: 'Nieprawidłowa wiadomość.' }, 400);
    console.error('Profile API error', error);
    return json({ error: 'Nie udało się zapisać profilu.' }, 500);
  }
}
