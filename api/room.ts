import { firebaseConfigured, firebaseDatabase } from './firebase.js';
import { handleHostedAction, HostedError, type HostedAction, type HostedStore, type StoredMatch } from '../src/server/hosted.js';
import { ensureProgress, progressIdForToken, awardProgressMatch } from './profile.js';
import { rewardForOutcome, STARTER_BALL_IDS } from '../src/shared/progression.js';

const ROOM_TTL_MS = 60 * 60 * 1000;

interface DatabaseRoom {
  match: StoredMatch;
  expiresAt: number;
}

interface RoomReference {
  transaction(update: (current: unknown) => DatabaseRoom | null | undefined,
    onComplete?: undefined, applyLocally?: boolean): Promise<{ committed: boolean }>;
  once(eventType: 'value'): Promise<{ val(): DatabaseRoom | null }>;
}

function database() {
  if (!firebaseConfigured()) throw new HostedError('Serwer 1v1 nie jest jeszcze skonfigurowany', 503);
  return firebaseDatabase();
}

const roomRef = (code: string) => (database() as unknown as { ref(path: string): RoomReference }).ref(`orbita/rooms/${code}`);
const record = (match: StoredMatch): DatabaseRoom => ({
  match: JSON.parse(JSON.stringify(match)) as StoredMatch,
  expiresAt: Date.now() + ROOM_TTL_MS,
});

const store: HostedStore = {
  async create(code, match) {
    const result = await roomRef(code).transaction(current => {
      const existing = current as DatabaseRoom | null;
      return !existing || existing.expiresAt <= Date.now() ? record(match) : undefined;
    }, undefined, false);
    return result.committed;
  },
  async transact<T>(code: string, change: (match: StoredMatch | null) => { next: StoredMatch | null; result: T }): Promise<T> {
    const ref = roomRef(code);
    let reply: T | undefined;
    let failure: unknown;
    const result = await ref.transaction(current => {
      failure = undefined;
      try {
        const existing = current as DatabaseRoom | null;
        const live = existing && existing.expiresAt > Date.now() ? existing.match : null;
        const changed = change(live);
        reply = changed.result;
        return changed.next ? record(changed.next) : null;
      } catch (error) {
        failure = error;
        // An uncached RTDB transaction starts with null, then retries with the
        // server value after the first compare-and-swap fails. Preserve that retry.
        if (current === null && error instanceof HostedError && error.status === 404) return null;
        return undefined;
      }
    }, undefined, false);
    if (failure) throw failure;
    if (!result.committed) throw new HostedError('Nie udało się zapisać pokoju', 503);
    return reply as T;
  },
};

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

export function GET() {
  return json({ online: firebaseConfigured() });
}

async function awardCompletedMatch(code: string, sessionToken?: string) {
  const record = (await roomRef(code).once('value')).val();
  const match = record?.match;
  const room = match?.room;
  if (!room || room.phase !== 'match_result' || !room.matchId) return 0;
  const [first, second] = room.score;
  const winnerTeam = first === second ? null : first > second ? 0 : 1;
  const requestedPlayer = sessionToken ? match.sessions[sessionToken] : undefined;
  let requestedReward = 0;
  for (const [slot, player] of room.players.entries()) {
    const profileId = match.profiles?.[player];
    if (!profileId) continue;
    const outcome = winnerTeam === null ? 'draw' : slot % 2 === winnerTeam ? 'win' : 'loss';
    await awardProgressMatch(profileId, room.matchId, outcome);
    if (player === requestedPlayer) requestedReward = rewardForOutcome(outcome);
  }
  return requestedReward;
}

export async function POST(request: Request) {
  try {
    const body = await request.text();
    if (body.length > 4096) throw new HostedError('Wiadomość jest za długa', 413);
    const parsed = JSON.parse(body) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new HostedError('Nieprawidłowa wiadomość');
    const action = parsed as HostedAction & { profileToken?: unknown };
    delete action.profileId;
    delete action.ownedBalls;
    if (action.type === 'create' || action.type === 'join') {
      if (action.profileToken !== undefined) {
        if (typeof action.profileToken !== 'string' || !/^[a-f0-9]{48}$/.test(action.profileToken)) throw new HostedError('Nieprawidłowy profil');
        const profileId = progressIdForToken(action.profileToken);
        const profile = await ensureProgress(profileId);
        action.profileId = profileId;
        action.ownedBalls = profile.ownedBalls;
      } else {
        action.ownedBalls = [...STARTER_BALL_IDS];
      }
      delete action.profileToken;
    } else delete action.profileToken;
    const reply = await handleHostedAction(store, action);
    if (reply.type === 'state' && reply.phase === 'match_result') {
      try {
        const reward = await awardCompletedMatch(reply.code, action.token);
        if (reward > 0) return json({ ...reply, reward });
      } catch (error) { console.error('Profile reward update failed', error); }
    }
    return json(reply);
  } catch (error) {
    if (error instanceof HostedError) return json({ type: 'error', message: error.message }, error.status);
    if (error instanceof SyntaxError) return json({ type: 'error', message: 'Nieprawidłowa wiadomość' }, 400);
    console.error('Hosted room error', error);
    return json({ type: 'error', message: 'Błąd serwera gry' }, 500);
  }
}
