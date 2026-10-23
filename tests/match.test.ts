import { expect, it } from 'vitest';
import { MATCH_BALLS } from '../src/shared/config';
import { Rooms } from '../src/server/rooms';

it('runs three scored rounds and a rematch without recreating the room', () => {
  const rooms = new Rooms(); rooms.create('a','MATCH1'); rooms.join('b','MATCH1');
  rooms.setReady('a',123); rooms.setReady('b',123);
  let firstOffer = '';
  for(let round=1;round<=3;round++){
    expect(rooms.snapshot('a').phase).toBe('select');
    expect(rooms.snapshot('a').offer).toHaveLength(3);
    firstOffer=rooms.snapshot('a').offer[0];
    rooms.select('a',firstOffer); rooms.select('b',rooms.snapshot('b').offer[0]);
    rooms.aim('a',0); rooms.aim('b',Math.PI);
    const world=rooms.forPlayer('a').world!;
    world.balls[1].hp=1;
    world.balls[0].hp=world.balls[0].maxHp;
    for(let i=0;i<3600 && rooms.forPlayer('a').phase==='fight';i++) rooms.tick();
    expect(rooms.snapshot('a').phase).toBe('round_result');
    for(let i=0;i<300;i++)rooms.tick();
  }
  expect(rooms.snapshot('a').phase).toBe('match_result');
  expect(rooms.snapshot('a').score).toEqual([3,0]);
  rooms.rematch('a',999); expect(rooms.snapshot('a').phase).toBe('match_result');
  rooms.rematch('b',999); expect(rooms.snapshot('a').phase).toBe('select');
  expect(rooms.snapshot('a').score).toEqual([0,0]);
  expect(MATCH_BALLS.some(b=>b.id===firstOffer)).toBe(true);
});

it('waits for every player to choose and aim without automatic picks',()=>{
  const rooms=new Rooms(); rooms.create('a','MATCH2');rooms.join('b','MATCH2');rooms.setReady('a',1);rooms.setReady('b',1);
  const own=rooms.snapshot('a').offer;const other=MATCH_BALLS.find(b=>!own.includes(b.id))!.id;
  expect(()=>rooms.select('a',other)).toThrow();
  rooms.select('a',other,true);
  for(let i=0;i<1200;i++)rooms.tick();
  expect(rooms.snapshot('a').phase).toBe('select');
  expect(rooms.snapshot('b').pick).toBeNull();
  rooms.select('b',rooms.snapshot('b').offer[0]);
  expect(rooms.snapshot('a').phase).toBe('aim');
  for(let i=0;i<1200;i++)rooms.tick();
  expect(rooms.snapshot('a').phase).toBe('aim');
  rooms.aim('a',0);rooms.aim('b',Math.PI);
  expect(rooms.snapshot('a').phase).toBe('fight');
  expect(rooms.snapshot('a').collectionUsed).toBe(true);
});
