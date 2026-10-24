import { randomBytes, randomUUID } from 'node:crypto';
import { Rooms, serializeRoom, type StoredRoom } from './rooms.js';

export interface StoredMatch {
  room: StoredRoom;
  sessions: Record<string, string>;
  lastSeen: Record<string, number>;
  updatedAt: number;
}

export interface HostedStore {
  create(code: string, match: StoredMatch): Promise<boolean>;
  transact<T>(code: string, change: (match: StoredMatch | null) => { next: StoredMatch | null; result: T }): Promise<T>;
}

export class HostedError extends Error {
  constructor(message: string, readonly status = 400) { super(message); }
}

export type HostedAction = {
  type: string; mode?: string; code?: string; token?: string;
  id?: string; collection?: boolean; angle?: number;
};
export type HostedReply = ({ type: 'state'; token?: string } & ReturnType<Rooms['snapshot']>) | { type: 'left' };

const TICK_MS = 1000 / 60;
const PRESENCE_GRACE_MS = 12_000;
const FORFEIT_MS = 42_000;
const CODE = /^[A-F0-9]{6}$/;
const TOKEN = /^[a-f0-9]{48}$/;

function requireCode(value: unknown): string {
  if (typeof value !== 'string' || !CODE.test(value)) throw new HostedError('Nieprawidłowy kod pokoju');
  return value;
}

function requireToken(value: unknown): string {
  if (typeof value !== 'string' || !TOKEN.test(value)) throw new HostedError('Nieprawidłowa sesja');
  return value;
}

function gameAction<T>(action: () => T): T {
  try { return action(); }
  catch (error) {
    if (error instanceof HostedError) throw error;
    if (error instanceof Error) throw new HostedError(error.message);
    throw error;
  }
}

function restore(match: StoredMatch, now: number) {
  const rooms = new Rooms(Number(process.env.WINS_TO_MATCH || 3));
  const room = rooms.importRoom(match.room);
  const elapsed = Math.max(0, Math.min(60 * 60 * 1000, now - match.updatedAt));
  const ticks = Math.floor(elapsed / TICK_MS);
  for (let i = 0; i < ticks && rooms.rooms.has(room.code); i++) rooms.tick();
  if (!rooms.rooms.has(room.code)) throw new HostedError('Pokój wygasł', 404);

  for (const player of room.players) {
    const age = now - (match.lastSeen[player] ?? match.updatedAt);
    if (age <= PRESENCE_GRACE_MS || room.forfeited.has(player)) continue;
    if (!room.disconnected.has(player)) rooms.disconnect(player);
    room.disconnected.set(player, room.clock + Math.max(0, Math.round((FORFEIT_MS - age) / TICK_MS)));
    if (age >= FORFEIT_MS) rooms.tick();
  }
  if (!rooms.rooms.has(room.code)) throw new HostedError('Pokój wygasł', 404);
  return { rooms, room };
}

export async function handleHostedAction(store: HostedStore, action: HostedAction, now = Date.now()): Promise<HostedReply> {
  if (!action || typeof action.type !== 'string') throw new HostedError('Nieprawidłowa akcja');
  if (action.type === 'create') {
    if (action.mode !== '1v1') throw new HostedError('Na stronie dostępny jest obecnie tryb 1v1');
    for (let attempt = 0; attempt < 8; attempt++) {
      const code = randomBytes(3).toString('hex').toUpperCase();
      const player = randomUUID(), token = randomBytes(24).toString('hex');
      const rooms = new Rooms(Number(process.env.WINS_TO_MATCH || 3));
      const room = rooms.create(player, code, '1v1');
      const match = { room: serializeRoom(room), sessions: { [token]: player }, lastSeen: { [player]: now }, updatedAt: now };
      if (await store.create(code, match)) return { type: 'state' as const, token, ...rooms.snapshot(player) };
    }
    throw new HostedError('Nie udało się utworzyć pokoju. Spróbuj ponownie.', 503);
  }

  const code = requireCode(action.code);
  if (action.type === 'join') {
    const player = randomUUID(), token = randomBytes(24).toString('hex');
    return store.transact<HostedReply>(code, current => {
      if (!current) throw new HostedError('Nie znaleziono pokoju', 404);
      const { rooms } = restore(current, now);
      const room = gameAction(() => rooms.join(player, code));
      current.sessions[token] = player;
      current.lastSeen[player] = now;
      return { next: { ...current, room: serializeRoom(room), updatedAt: now },
        result: { type: 'state' as const, token, ...rooms.snapshot(player) } };
    });
  }

  const token = requireToken(action.token);
  return store.transact<HostedReply>(code, current => {
    if (!current) throw new HostedError('Pokój wygasł', 404);
    const player = current.sessions[token];
    if (!player) throw new HostedError('Sesja wygasła', 401);
    const { rooms } = restore(current, now);
    gameAction(() => rooms.reconnect(player));
    current.lastSeen[player] = now;

    if (action.type === 'ready') gameAction(() => rooms.setReady(player, randomBytes(4).readUInt32LE()));
    else if (action.type === 'select') {
      if (typeof action.id !== 'string' || typeof action.collection !== 'boolean' || typeof action.angle !== 'number') throw new HostedError('Nieprawidłowy wybór');
      gameAction(() => rooms.select(player, action.id!, action.collection!, action.angle));
    }
    else if (action.type === 'aim') {
      if (typeof action.angle !== 'number') throw new HostedError('Nieprawidłowy kierunek');
      gameAction(() => rooms.aim(player, action.angle!));
    }
    else if (action.type === 'rematch') gameAction(() => rooms.rematch(player, randomBytes(4).readUInt32LE()));
    else if (action.type === 'leave') {
      rooms.leave(player);
      delete current.sessions[token]; delete current.lastSeen[player];
      const room = rooms.rooms.get(code);
      return { next: room ? { ...current, room: serializeRoom(room), updatedAt: now } : null,
        result: { type: 'left' as const } };
    }
    else if (action.type !== 'poll' && action.type !== 'resume') throw new HostedError('Niedozwolona akcja');

    const room = rooms.forPlayer(player);
    return { next: { ...current, room: serializeRoom(room), updatedAt: now },
      result: { type: 'state' as const, ...rooms.snapshot(player) } };
  });
}
