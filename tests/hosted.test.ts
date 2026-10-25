import { expect, it } from 'vitest';
import { handleHostedAction, type HostedStore, type StoredMatch } from '../src/server/hosted';

function state(reply: Awaited<ReturnType<typeof handleHostedAction>>) {
  if (reply.type !== 'state') throw new Error('Oczekiwano stanu pokoju');
  return reply;
}

function memoryStore() {
  const rooms = new Map<string, StoredMatch>();
  const store: HostedStore = {
    async create(code, match) { if (rooms.has(code)) return false; rooms.set(code, match); return true; },
    async transact(code, change) {
      const { next, result } = change(rooms.get(code) ?? null);
      if (next) rooms.set(code, next); else rooms.delete(code);
      return result;
    },
  };
  return { store, rooms };
}

it('runs one hosted 1v1 room through two independent player sessions', async () => {
  const { store } = memoryStore();
  const now = 1_000_000;
  const host = state(await handleHostedAction(store, { type: 'create', mode: '1v1' }, now));
  const guest = state(await handleHostedAction(store, { type: 'join', code: host.code }, now + 20));
  expect(host.slot).toBe(0);
  expect(guest.slot).toBe(1);
  const a = { code: host.code, token: host.token! };
  const b = { code: host.code, token: guest.token! };
  await handleHostedAction(store, { type: 'ready', ...a }, now + 40);
  const choosing = state(await handleHostedAction(store, { type: 'ready', ...b }, now + 60));
  expect(choosing.phase).toBe('select');
  const hostOffer = state(await handleHostedAction(store, { type: 'poll', ...a }, now + 60));
  await handleHostedAction(store, { type: 'select', id: hostOffer.offer[0], collection: false, angle: 0, ...a }, now + 80);
  const fighting = state(await handleHostedAction(store, { type: 'select', id: choosing.offer[0], collection: false, angle: Math.PI, ...b }, now + 100));
  expect(fighting.phase).toBe('fight');
  const hostView = state(await handleHostedAction(store, { type: 'poll', ...a }, now + 1100));
  const guestView = state(await handleHostedAction(store, { type: 'poll', ...b }, now + 1100));
  expect(hostView.world?.tick).toBeGreaterThan(50);
  expect(hostView.world).toEqual(guestView.world);
  expect(hostView.world?.contacts).toBeInstanceOf(Array);
  expect(await handleHostedAction(store, { type: 'resume', ...b }, now + 1500)).toMatchObject({ code: host.code, slot: 1 });
  let result = hostView;
  for (const seconds of [10, 20, 30, 40, 50]) {
    result = state(await handleHostedAction(store, { type: 'poll', ...a }, now + seconds * 1000));
    const other = state(await handleHostedAction(store, { type: 'poll', ...b }, now + seconds * 1000));
    expect(result.score).toEqual(other.score);
  }
  expect(result.round > 1 || result.score[0] + result.score[1] > 0).toBe(true);
});

it('rejects unknown sessions and full rooms', async () => {
  const { store } = memoryStore();
  const host = state(await handleHostedAction(store, { type: 'create', mode: '1v1' }, 1000));
  await expect(handleHostedAction(store, { type: 'poll', code: host.code, token: 'f'.repeat(48) }, 1000)).rejects.toThrow('Sesja wygasła');
  await handleHostedAction(store, { type: 'join', code: host.code }, 1000);
  await expect(handleHostedAction(store, { type: 'join', code: host.code }, 1000)).rejects.toThrow('Nie można dołączyć');
});

it('stores only server-derived profile ids on hosted player seats', async () => {
  const { store, rooms } = memoryStore();
  const hostId = 'a'.repeat(64), guestId = 'b'.repeat(64);
  const host = state(await handleHostedAction(store, { type: 'create', mode: '1v1', profileId: hostId }, 1000));
  const guest = state(await handleHostedAction(store, { type: 'join', code: host.code, profileId: guestId }, 1100));
  expect(rooms.get(host.code)?.profiles).toEqual({
    [rooms.get(host.code)!.room.players[0]]: hostId,
    [rooms.get(host.code)!.room.players[1]]: guestId,
  });
  expect(guest.slot).toBe(1);
});
