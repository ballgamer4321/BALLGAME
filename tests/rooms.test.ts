import { expect, it } from 'vitest';
import { Rooms } from '../src/server/rooms';

it('starts only when both players are ready and exposes the same battle result', () => {
  const rooms = new Rooms();
  rooms.create('a', 'ABC123'); rooms.join('b', 'ABC123');
  rooms.setReady('a', 12);
  expect(rooms.forPlayer('a').world).toBeNull();
  rooms.setReady('b', 12);
  rooms.select('a', rooms.snapshot('a').offer[0]); rooms.select('b', rooms.snapshot('b').offer[0]);
  expect(rooms.snapshot('a').angleLocked).toBe(false);
  rooms.aim('a', 0);
  expect(rooms.snapshot('a').angleLocked).toBe(true);
  expect(rooms.snapshot('b').angleLocked).toBe(false);
  rooms.aim('b', Math.PI);
  for (let i = 0; i < 2700 && rooms.snapshot('a').phase === 'fight'; i++) rooms.tick();
  expect(rooms.snapshot('a').phase).toBe('round_result');
  expect(rooms.snapshot('a').world).toEqual(rooms.snapshot('b').world);
  expect(() => rooms.setReady('a', 99)).toThrow();
});

it('starts immediately after both players confirm a ball and direction', () => {
  const rooms=new Rooms();rooms.create('a','PICK42');rooms.join('b','PICK42');
  rooms.setReady('a',42);rooms.setReady('b',42);
  expect(rooms.snapshot('a').offer).toHaveLength(3);
  rooms.select('a',rooms.snapshot('a').offer[0],false,0.4);
  expect(rooms.snapshot('a').phase).toBe('select');
  expect(rooms.snapshot('a').players.map(player=>player.chosen)).toEqual([true,false]);
  rooms.select('b',rooms.snapshot('b').offer[0],false,Math.PI);
  expect(rooms.snapshot('a').phase).toBe('fight');
  const ball=rooms.snapshot('a').world!.balls[0];
  expect(Math.atan2(ball.vy,ball.vx)).toBeCloseTo(0.4);
});

it('rejects excess membership and cleans up abandoned rooms', () => {
  const rooms = new Rooms();
  rooms.create('a', 'ABC123'); rooms.join('b', 'ABC123');
  expect(() => rooms.join('c', 'ABC123')).toThrow();
  expect(() => rooms.create('a', 'XYZ123')).toThrow();
  expect(() => rooms.setReady('outsider', 1)).toThrow();
  rooms.setReady('a', 1); rooms.setReady('b', 1);
  rooms.leave('a');
  expect(rooms.snapshot('b').phase).toBe('abandoned');
  rooms.leave('b'); expect(rooms.rooms.size).toBe(0);
});

it('runs a four-player team round with shared score and no friendly damage', () => {
  const rooms = new Rooms(1);
  rooms.create('a','TEAM42','2v2');
  for(const id of ['b','c','d']) rooms.join(id,'TEAM42');
  expect(()=>rooms.join('e','TEAM42')).toThrow();
  for(const id of ['a','b','c','d'])rooms.setReady(id,42);
  for(const id of ['a','b','c','d'])rooms.select(id,rooms.snapshot(id).offer[0]);
  for(const [i,id] of ['a','b','c','d'].entries())rooms.aim(id,i%2?Math.PI:0);
  const world=rooms.forPlayer('a').world!;
  expect(world.balls.map(ball=>ball.team)).toEqual([0,1,0,1]);
  world.balls[1].hp=1;world.balls[3].hp=0;
  for(let i=0;i<2700 && rooms.forPlayer('a').phase==='fight';i++)rooms.tick();
  expect(rooms.snapshot('a').score).toEqual([1,0]);
  expect(rooms.snapshot('a').world).toEqual(rooms.snapshot('d').world);
});

it('starts labeled bot training and supports reconnect before grace expires', () => {
  const rooms=new Rooms(1);
  rooms.create('human','BOT123','bot');
  expect(rooms.snapshot('human').players[1].bot).toBe(true);
  rooms.setReady('human',12);
  rooms.select('human',rooms.snapshot('human').offer[0]);
  expect(rooms.snapshot('human').phase).toBe('aim');
  rooms.aim('human',0);
  expect(rooms.snapshot('human').phase).toBe('fight');
  rooms.disconnect('human');
  expect(rooms.snapshot('human').players[0].connected).toBe(false);
  for(let i=0;i<100;i++)rooms.tick();
  rooms.reconnect('human');
  expect(rooms.snapshot('human').players[0].connected).toBe(true);
  rooms.leave('human');
  expect(rooms.rooms.size).toBe(0);
});

it('removes idle rooms and expires disconnected sessions', () => {
  const rooms=new Rooms();rooms.create('a','IDLE42');
  for(let i=0;i<10*60*60;i++)rooms.tick();
  expect(rooms.rooms.size).toBe(0);
  rooms.create('b','DROP42');rooms.disconnect('b');
  for(let i=0;i<30*60;i++)rooms.tick();
  expect(rooms.rooms.size).toBe(0);
});

it('awards a 1v1 walkover after the reconnect window closes', () => {
  const rooms=new Rooms();rooms.create('a','LOST42');rooms.join('b','LOST42');
  rooms.setReady('a',1);rooms.setReady('b',1);
  rooms.disconnect('b');
  for(let i=0;i<30*60;i++)rooms.tick();
  expect(rooms.snapshot('a').phase).toBe('match_result');
  expect(rooms.snapshot('a').score).toEqual([3,0]);
  expect(rooms.snapshot('a').rematchAvailable).toBe(false);
  expect(()=>rooms.reconnect('b')).toThrow();
});

it('does not rewrite a finished match when a player disconnects afterward', () => {
  const rooms=new Rooms(1);rooms.create('a','DONE42');rooms.join('b','DONE42');
  rooms.setReady('a',1);rooms.setReady('b',1);
  rooms.select('a',rooms.snapshot('a').offer[0]);rooms.select('b',rooms.snapshot('b').offer[0]);
  rooms.aim('a',0);rooms.aim('b',Math.PI);
  for(let i=0;i<3000 && rooms.snapshot('a').phase!=='match_result';i++)rooms.tick();
  expect(rooms.snapshot('a').phase).toBe('match_result');
  const score=rooms.snapshot('a').score;
  rooms.disconnect('b');for(let i=0;i<30*60;i++)rooms.tick();
  expect(rooms.snapshot('a').score).toEqual(score);
  expect(rooms.snapshot('a').phase).toBe('match_result');
});

it('eliminates a missing 2v2 player while the teammate can keep fighting', () => {
  const rooms=new Rooms(1);rooms.create('a','TEAM24','2v2');
  for(const id of ['b','c','d'])rooms.join(id,'TEAM24');
  for(const id of ['a','b','c','d'])rooms.setReady(id,1);
  for(const id of ['a','b','c','d'])rooms.select(id,'steel',true);
  for(const [i,id] of ['a','b','c','d'].entries())rooms.aim(id,i%2?Math.PI:0);
  for(const ball of rooms.forPlayer('a').world!.balls){ball.vx=0;ball.vy=0;}
  rooms.disconnect('c');
  for(let i=0;i<30*60;i++)rooms.tick();
  expect(rooms.snapshot('a').players[2].connected).toBe(false);
  expect(rooms.snapshot('a').world?.balls[2].hp).toBe(0);
  expect(rooms.snapshot('a').phase).not.toBe('abandoned');
  expect(()=>rooms.reconnect('c')).toThrow();
});
