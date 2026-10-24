import { POST } from '../api/room';
import { deleteApp, getApps } from 'firebase-admin/app';

type Reply = { type: string; code?: string; token?: string; phase?: string; slot?: number; offer?: string[]; world?: { tick: number } | null; message?: string };

async function action(payload: Record<string, unknown>): Promise<Reply> {
  const request = new Request(process.env.ORBITA_SMOKE_URL || 'http://localhost/api/room', { method: 'POST', body: JSON.stringify(payload) });
  const response = process.env.ORBITA_SMOKE_URL ? await fetch(request) : await POST(request);
  const result = await response.json() as Reply;
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${result.message}`);
  return result;
}

let host: Reply | undefined;
let guest: Reply | undefined;
try {
  host = await action({ type: 'create', mode: '1v1' });
  guest = await action({ type: 'join', code: host.code });
  const a = { code: host.code, token: host.token };
  const b = { code: host.code, token: guest.token };
  await action({ type: 'ready', ...a });
  const choice = await action({ type: 'ready', ...b });
  const first = await action({ type: 'poll', ...a });
  await action({ type: 'select', id: first.offer?.[0], collection: false, angle: 0, ...a });
  const started = await action({ type: 'select', id: choice.offer?.[0], collection: false, angle: Math.PI, ...b });
  const [left, right] = await Promise.all([action({ type: 'poll', ...a }), action({ type: 'poll', ...b })]);
  if (started.phase !== 'fight' || left.phase !== 'fight' || right.phase !== 'fight' || left.slot === right.slot)
    throw new Error('Dwa okna nie widzą wspólnej walki');
  console.log(`Hosted 1v1 OK: pokój ${host.code}, dwa sloty, faza ${started.phase}, tick ${left.world?.tick}`);
} finally {
  if (host?.code && host?.token) await action({ type: 'leave', code: host.code, token: host.token }).catch(() => {});
  if (host?.code && guest?.token) await action({ type: 'leave', code: host.code, token: guest.token }).catch(() => {});
  const app = getApps().find(candidate => candidate.name === 'orbita-hosted');
  if (app) await deleteApp(app);
}
