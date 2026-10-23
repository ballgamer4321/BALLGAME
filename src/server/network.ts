import { createServer } from 'node:http';
import { randomBytes, randomUUID } from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';
import { Rooms, type RoomMode } from './rooms';

export function createGameServer() {
  const rooms = new Rooms(Number(process.env.WINS_TO_MATCH || 3));
  const http = createServer((_req, res) => { res.writeHead(200); res.end('Orbita server'); });
  const wss = new WebSocketServer({ server: http, path: '/ws', maxPayload: 4096 });
  const clients = new Map<WebSocket, string>();
  const sessions = new Map<string, string>();
  function broadcast() {
    for (const [socket, id] of clients) {
      if (socket.readyState !== WebSocket.OPEN || socket.bufferedAmount > 65536) continue;
      try { socket.send(JSON.stringify({ type: 'state', ...rooms.snapshot(id) })); } catch { /* not in a room */ }
    }
  }
  wss.on('connection', socket => {
    let id: string = randomUUID(); clients.set(socket, id);
    let windowStart = Date.now(), count = 0;
    socket.on('message', raw => {
      if (Date.now() - windowStart > 1000) { count = 0; windowStart = Date.now(); }
      if (++count > 20) { socket.close(1008, 'Rate limit'); return; }
      try {
        const action = JSON.parse(raw.toString());
        if (!action || typeof action !== 'object') throw new Error('Nieprawidłowa wiadomość');
        if (action.type === 'create' && ['1v1','2v2','bot'].includes(action.mode ?? '1v1')) {
          rooms.create(id, randomBytes(3).toString('hex').toUpperCase(),(action.mode ?? '1v1') as RoomMode);
          const token=randomBytes(24).toString('hex');sessions.set(token,id);socket.send(JSON.stringify({type:'session',token}));
        }
        else if (action.type === 'join' && typeof action.code === 'string' && /^[A-Z0-9]{6}$/.test(action.code)) {
          rooms.join(id, action.code);
          const token=randomBytes(24).toString('hex');sessions.set(token,id);socket.send(JSON.stringify({type:'session',token}));
        }
        else if(action.type==='resume' && typeof action.token==='string'){
          const existing=sessions.get(action.token);
          if(!existing || [...clients].some(([peer,player])=>peer!==socket && peer.readyState===WebSocket.OPEN && player===existing))throw new Error('Sesja jest już aktywna lub wygasła');
          rooms.reconnect(existing);id=existing;clients.set(socket,id);
        }
        else if (action.type === 'ready') rooms.setReady(id, randomBytes(4).readUInt32LE());
        else if (action.type === 'select' && typeof action.id === 'string' && typeof action.collection === 'boolean' && (action.angle === undefined || typeof action.angle === 'number')) rooms.select(id, action.id, action.collection, action.angle);
        else if (action.type === 'aim' && typeof action.angle === 'number') rooms.aim(id, action.angle);
        else if (action.type === 'rematch') rooms.rematch(id, randomBytes(4).readUInt32LE());
        else if (action.type === 'leave') { rooms.leave(id);for(const [token,player] of sessions)if(player===id)sessions.delete(token);socket.send(JSON.stringify({ type: 'left' })); }
        else throw new Error('Niedozwolona akcja');
        broadcast();
      } catch (error) { socket.send(JSON.stringify({ type: 'error', message: error instanceof Error ? error.message : 'Błąd' })); }
    });
    socket.on('close', () => { rooms.disconnect(id); clients.delete(socket); broadcast(); });
    socket.on('error', () => socket.close());
  });
  let previous = performance.now(), accumulator = 0, ticks = 0;
  const timer = setInterval(() => {
    const now = performance.now(); accumulator += Math.min(now - previous, 250); previous = now;
    while (accumulator >= 1000 / 60) { rooms.tick(); accumulator -= 1000 / 60; ticks++; }
    if (ticks >= 3) {
      broadcast();ticks = 0;
      for(const [token,player] of sessions){try{rooms.forPlayer(player);}catch{sessions.delete(token);}}
    }
  }, 8);
  return { http, rooms, broadcast, close: async () => {
    clearInterval(timer); for (const socket of clients.keys()) socket.terminate();
    await new Promise<void>(resolve => wss.close(() => resolve()));
    await new Promise<void>(resolve => http.close(() => resolve()));
  } };
}
