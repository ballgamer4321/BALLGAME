import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { handleHostedAction, HostedError, type HostedAction, type HostedStore, type StoredMatch } from '../src/server/hosted.js';

const APP_NAME = 'orbita-hosted';
const ROOM_TTL_MS = 60 * 60 * 1000;

interface DatabaseRoom {
  match: StoredMatch;
  expiresAt: number;
}

interface RoomReference {
  transaction(update: (current: unknown) => DatabaseRoom | null | undefined,
    onComplete?: undefined, applyLocally?: boolean): Promise<{ committed: boolean }>;
}

function configured() {
  return Boolean(process.env.FIREBASE_DATABASE_URL &&
    (process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS));
}

function database() {
  if (!configured()) throw new HostedError('Serwer 1v1 nie jest jeszcze skonfigurowany', 503);
  let app = getApps().find(candidate => candidate.name === APP_NAME);
  if (!app) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const key = raw ? JSON.parse(raw) as { project_id: string; client_email: string; private_key: string } : null;
    app = initializeApp({
      credential: key ? cert({ projectId: key.project_id, clientEmail: key.client_email, privateKey: key.private_key }) : applicationDefault(),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    }, APP_NAME);
  }
  return getDatabase(app);
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
  return json({ online: configured() });
}

export async function POST(request: Request) {
  try {
    const body = await request.text();
    if (body.length > 4096) throw new HostedError('Wiadomość jest za długa', 413);
    const action = JSON.parse(body) as HostedAction;
    return json(await handleHostedAction(store, action));
  } catch (error) {
    if (error instanceof HostedError) return json({ type: 'error', message: error.message }, error.status);
    if (error instanceof SyntaxError) return json({ type: 'error', message: 'Nieprawidłowa wiadomość' }, 400);
    console.error('Hosted room error', error);
    return json({ type: 'error', message: 'Błąd serwera gry' }, 500);
  }
}
