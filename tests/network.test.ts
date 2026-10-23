import { expect, it } from 'vitest';
import { WebSocket } from 'ws';
import { createGameServer } from '../src/server/network';

it('two independent sockets receive identical HP and final result', async () => {
  const server = createGameServer();
  await new Promise<void>(resolve => server.http.listen(0, '127.0.0.1', resolve));
  const address = server.http.address() as { port: number };
  const a = new WebSocket(`ws://127.0.0.1:${address.port}/ws`);
  const b = new WebSocket(`ws://127.0.0.1:${address.port}/ws`);
  const inboxA: any[] = [], inboxB: any[] = [];
  a.on('message', raw => inboxA.push(JSON.parse(raw.toString())));
  b.on('message', raw => inboxB.push(JSON.parse(raw.toString())));
  const until = async (predicate: () => boolean) => {
    const deadline = Date.now() + 3000;
    while (!predicate()) { if (Date.now() > deadline) throw new Error('Timeout'); await new Promise(r => setTimeout(r, 10)); }
  };
  try {
    await until(() => a.readyState === 1 && b.readyState === 1);
    a.send(JSON.stringify({ type: 'create' }));
    await until(() => inboxA.some(s => s.code));
    b.send(JSON.stringify({ type: 'join', code: inboxA.find(s => s.code).code }));
    await until(() => inboxB.some(s => s.players?.length === 2));
    a.send(JSON.stringify({ type: 'ready' })); b.send(JSON.stringify({ type: 'ready' }));
    await until(() => inboxA.some(s => s.phase === 'select') && inboxB.some(s => s.phase === 'select'));
    a.send(JSON.stringify({ type: 'select', id: inboxA.filter(s => s.phase === 'select').at(-1).offer[0], collection: false }));
    b.send(JSON.stringify({ type: 'select', id: inboxB.filter(s => s.phase === 'select').at(-1).offer[0], collection: false }));
    await until(() => inboxA.some(s => s.phase === 'aim'));
    a.send(JSON.stringify({ type: 'aim', angle: 0 })); b.send(JSON.stringify({ type: 'aim', angle: Math.PI }));
    await until(() => inboxA.some(s => s.phase === 'fight'));
    // Accelerate only the test's server ticks, never client-supplied time.
    for (let i = 0; i < 3600 && ![...server.rooms.rooms.values()].some(room => room.phase === 'round_result'); i++) server.rooms.tick();
    server.broadcast();
    await until(() => inboxA.some(s => s.phase === 'round_result') && inboxB.some(s => s.phase === 'round_result'));
    expect(inboxA.find(s => s.phase === 'round_result').world).toEqual(inboxB.find(s => s.phase === 'round_result').world);
    a.send(JSON.stringify({ type: 'setWinner', winner: 'amber' }));
    await until(() => inboxA.some(s => s.type === 'error'));
  } finally { a.terminate(); b.terminate(); await server.close(); }
});

it('four sockets play 2v2 and a disconnected player resumes the same slot', async () => {
  const server=createGameServer();
  await new Promise<void>(resolve=>server.http.listen(0,'127.0.0.1',resolve));
  const port=(server.http.address() as {port:number}).port;
  const peers=Array.from({length:4},()=>new WebSocket(`ws://127.0.0.1:${port}/ws`));
  const inbox:any[][]=peers.map(()=>[]);
  peers.forEach((socket,i)=>socket.on('message',raw=>inbox[i].push(JSON.parse(raw.toString()))));
  const until=async(predicate:()=>boolean)=>{const end=Date.now()+3000;while(!predicate()){if(Date.now()>end)throw new Error('Timeout');await new Promise(resolve=>setTimeout(resolve,10));}};
  let replacement:WebSocket|undefined;
  try{
    await until(()=>peers.every(socket=>socket.readyState===1));
    peers[0].send(JSON.stringify({type:'create',mode:'2v2'}));
    await until(()=>inbox[0].some(message=>message.code));
    const code=inbox[0].find(message=>message.code).code;
    for(let i=1;i<4;i++){peers[i].send(JSON.stringify({type:'join',code}));await until(()=>inbox[i].some(message=>message.code));}
    for(const socket of peers)socket.send(JSON.stringify({type:'ready'}));
    await until(()=>inbox.every(messages=>messages.some(message=>message.phase==='select')));
    for(let i=0;i<4;i++){const state=inbox[i].filter(message=>message.phase==='select').at(-1);peers[i].send(JSON.stringify({type:'select',id:state.offer[0],collection:false,angle:i%2?Math.PI:0}));}
    await until(()=>inbox.every(messages=>messages.some(message=>message.phase==='fight')));
    const worlds=inbox.map(messages=>messages.find(message=>message.phase==='fight').world);
    expect(worlds.every(world=>JSON.stringify(world)===JSON.stringify(worlds[0]))).toBe(true);
    expect(worlds[0].balls).toHaveLength(4);
    const token=inbox[2].find(message=>message.type==='session').token;
    peers[2].close();await until(()=>server.rooms.snapshot(server.rooms.rooms.get(code)!.players[0]).players[2].connected===false);
    replacement=new WebSocket(`ws://127.0.0.1:${port}/ws`);
    const returned:any[]=[];replacement.on('message',raw=>returned.push(JSON.parse(raw.toString())));
    await until(()=>replacement!.readyState===1);
    replacement.send(JSON.stringify({type:'resume',token}));
    await until(()=>returned.some(message=>message.phase==='fight'));
    expect(returned.find(message=>message.phase==='fight').slot).toBe(2);
    expect(server.rooms.rooms.get(code)!.disconnected.size).toBe(0);
  }finally{replacement?.terminate();peers.forEach(socket=>socket.terminate());await server.close();}
});
