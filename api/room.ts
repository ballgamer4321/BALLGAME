import { randomUUID } from 'node:crypto';
import { Redis } from '@upstash/redis';
import { handleHostedAction, HostedError, type HostedAction, type HostedStore, type StoredMatch } from '../src/server/hosted';

const ROOM_TTL_SECONDS = 3600;
const LOCK_MS = 10_000;
const roomKey = (code: string) => `orbita:room:${code}`;
const lockKey = (code: string) => `orbita:lock:${code}`;
const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let client: Redis | undefined;
function credentials() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return url && token ? { url, token } : null;
}
function redis() {
  const config = credentials();
  if (!config)
    throw new HostedError('Serwer 1v1 nie jest jeszcze skonfigurowany', 503);
  return client ??= new Redis(config);
}

const store: HostedStore = {
  async create(code, match) {
    return (await redis().set(roomKey(code), match, { nx: true, ex: ROOM_TTL_SECONDS })) === 'OK';
  },
  async transact<T>(code: string, change: (match: StoredMatch | null) => { next: StoredMatch | null; result: T }): Promise<T> {
    const db = redis();
    const owner = randomUUID();
    let locked = false;
    for (let attempt = 0; attempt < 12; attempt++) {
      if (await db.set(lockKey(code), owner, { nx: true, px: LOCK_MS }) === 'OK') { locked = true; break; }
      await pause(35 + attempt * 15);
    }
    if (!locked) throw new HostedError('Pokój jest zajęty. Spróbuj ponownie.', 503);
    try {
      const current = await db.get<StoredMatch>(roomKey(code));
      const { next, result } = change(current);
      if (next) await db.set(roomKey(code), next, { ex: ROOM_TTL_SECONDS });
      else await db.del(roomKey(code));
      return result;
    } finally {
      await db.eval("if redis.call('GET',KEYS[1]) == ARGV[1] then return redis.call('DEL',KEYS[1]) else return 0 end", [lockKey(code)], [owner]);
    }
  },
};

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

export function GET() {
  return json({ online: !!credentials() });
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
