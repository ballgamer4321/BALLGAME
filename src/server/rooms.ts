import { MATCH_BALLS } from '../shared/config';
import { seededRandom } from '../shared/random';
import { createWorld, stepWorld, type World } from '../simulation/world';

type Phase = 'lobby' | 'select' | 'aim' | 'fight' | 'round_result' | 'match_result' | 'abandoned';
export type RoomMode = '1v1' | '2v2' | 'bot';
export interface Room {
  code: string; mode: RoomMode; players: string[]; ready: Set<string>; disconnected: Map<string, number>; forfeited: Set<string>; phase: Phase;
  world: World | null; seed: number; clock: number; deadline: number; idle: number;
  round: number; score: [number, number]; offers: Record<string,string[]>;
  picks: Record<string,string>; angles: Record<string,number>;
  collectionUsed: Set<string>; rematch: Set<string>;
}
export interface StoredRoom extends Omit<Room, 'ready' | 'disconnected' | 'forfeited' | 'collectionUsed' | 'rematch' | 'world'> {
  ready: string[]; disconnected: [string, number][]; forfeited: string[];
  collectionUsed: string[]; rematch: string[];
  world: (Omit<World, 'contacts'> & { contacts: string[] }) | null;
}

export function serializeRoom(room: Room): StoredRoom {
  return { ...room, ready: [...room.ready], disconnected: [...room.disconnected],
    forfeited: [...room.forfeited], collectionUsed: [...room.collectionUsed], rematch: [...room.rematch],
    world: room.world ? { ...room.world, contacts: [...room.world.contacts] } : null };
}

export function deserializeRoom(data: StoredRoom): Room {
  return { ...data, ready: new Set(data.ready), disconnected: new Map(data.disconnected),
    forfeited: new Set(data.forfeited), collectionUsed: new Set(data.collectionUsed), rematch: new Set(data.rematch),
    world: data.world ? { ...data.world, contacts: new Set(data.world.contacts) } : null };
}
export class Rooms {
  readonly rooms = new Map<string, Room>();
  private membership = new Map<string,string>();
  constructor(private winsToMatch = 3) {
    if (!Number.isInteger(winsToMatch) || winsToMatch < 1 || winsToMatch > 9) throw new Error('Nieprawidłowy próg zwycięstw');
  }
  importRoom(data: StoredRoom): Room {
    const room = deserializeRoom(data);
    this.rooms.set(room.code, room);
    for (const player of room.players) this.membership.set(player, room.code);
    return room;
  }
  create(player: string, code: string, mode: RoomMode = '1v1'): Room {
    if (!/^[A-Z0-9]{6}$/.test(code) || this.rooms.has(code) || this.membership.has(player) || this.rooms.size >= 100 || !['1v1','2v2','bot'].includes(mode)) throw new Error('Nie można utworzyć pokoju');
    const room: Room = {code,mode,players:[player],ready:new Set(),disconnected:new Map(),forfeited:new Set(),phase:'lobby',world:null,seed:0,clock:0,deadline:0,idle:0,round:0,score:[0,0],offers:{},picks:{},angles:{},collectionUsed:new Set(),rematch:new Set()};
    if(mode==='bot'){const bot=`bot:${code}`;room.players.push(bot);room.ready.add(bot);this.membership.set(bot,code);}
    this.rooms.set(code,room); this.membership.set(player,code); return room;
  }
  join(player:string,code:string):Room {
    const room=this.rooms.get(code);
    if (!room || room.phase!=='lobby' || room.players.length>=(room.mode==='2v2'?4:2) || this.membership.has(player)) throw new Error('Nie można dołączyć');
    room.players.push(player); this.membership.set(player,code); room.idle=room.clock; return room;
  }
  forPlayer(player:string):Room {
    const room=this.rooms.get(this.membership.get(player) ?? '');
    if (!room) throw new Error('Gracz nie należy do pokoju'); return room;
  }
  reconnect(player:string):Room {const room=this.forPlayer(player);if(room.forfeited.has(player))throw new Error('Czas na powrót minął');room.disconnected.delete(player);room.idle=room.clock;return room;}
  disconnect(player:string):void {const code=this.membership.get(player);if(!code)return;const room=this.rooms.get(code)!;room.disconnected.set(player,room.clock+30*60);}
  setReady(player:string,seed:number):Room {
    const room=this.forPlayer(player);
    if (room.phase!=='lobby') throw new Error('Niedozwolona faza');
    room.ready.add(player);room.idle=room.clock;
    if (room.players.length===(room.mode==='2v2'?4:2) && room.ready.size===room.players.length) {
      room.seed=seed>>>0; room.round=0; room.score=[0,0]; room.collectionUsed.clear(); this.nextRound(room);
    }
    return room;
  }
  private nextRound(room:Room) {
    room.round++; room.phase='select'; room.world=null; room.picks={}; room.angles={}; room.offers={};
    const random=seededRandom((room.seed+room.round*7919)>>>0);
    for(const player of room.players) {
      const pool=MATCH_BALLS.map(b=>b.id);
      for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
      room.offers[player]=pool.slice(0,3);
      if(player.startsWith('bot:') || room.forfeited.has(player)){
        room.picks[player]=pool[0];
        room.angles[player]=room.players.indexOf(player)%2===0?0:Math.PI;
      }
    }
    room.deadline=0;
  }
  select(player:string,id:string,collection=false,angle?:number):Room {
    const room=this.forPlayer(player);
    if(room.phase!=='select' || room.picks[player] || !MATCH_BALLS.some(b=>b.id===id) ||
      (angle!==undefined && (!Number.isFinite(angle) || angle< -Math.PI || angle>Math.PI))) throw new Error('Niedozwolony wybór');
    if(collection){if(room.collectionUsed.has(player)) throw new Error('Wybór z kolekcji wykorzystany');room.collectionUsed.add(player);}
    else if(!room.offers[player].includes(id)) throw new Error('Kulki nie ma w ofercie');
    room.picks[player]=id;room.idle=room.clock;
    if(angle!==undefined)room.angles[player]=angle;
    if(room.players.every(p=>room.picks[p])){
      if(room.players.every(p=>room.angles[p]!==undefined))this.startFight(room);
      else this.beginAim(room);
    }
    return room;
  }
  private beginAim(room:Room){room.phase='aim';room.deadline=0;room.players.forEach((p,i)=>{if(p.startsWith('bot:') || room.forfeited.has(p))room.angles[p]=i%2===0?0:Math.PI;});}
  aim(player:string,angle:number):Room {
    const room=this.forPlayer(player);
    if(room.phase!=='aim' || !Number.isFinite(angle) || angle< -Math.PI || angle>Math.PI || room.angles[player]!==undefined) throw new Error('Niedozwolony kierunek');
    room.angles[player]=angle;room.idle=room.clock;
    if(room.players.every(p=>room.angles[p]!==undefined)) this.startFight(room);
    return room;
  }
  private startFight(room:Room) {
    room.world=createWorld((room.seed+room.round)>>>0,room.players.map(p=>room.picks[p]),room.players.map(p=>room.angles[p]));
    room.players.forEach((p,i)=>{if(room.forfeited.has(p))room.world!.balls[i].hp=0;});
    room.phase='fight';room.idle=room.clock;
  }
  rematch(player:string,seed:number):Room {
    const room=this.forPlayer(player);
    if(room.phase!=='match_result' || room.forfeited.size) throw new Error('Mecz trwa lub brakuje gracza');
    room.rematch.add(player);
    if(room.mode==='bot')room.rematch.add(room.players[1]);
    if(room.rematch.size===room.players.length){room.seed=seed>>>0;room.score=[0,0];room.round=0;room.collectionUsed.clear();room.rematch.clear();this.nextRound(room);}
    return room;
  }
  tick():void {
    for(const room of [...this.rooms.values()]){
      room.clock++;
      for(const [player,deadline] of room.disconnected) if(room.clock>=deadline)this.expire(room,player);
      if(!this.rooms.has(room.code))continue;
      if(room.phase==='lobby' && room.clock-room.idle>=10*60*60){this.deleteRoom(room);continue;}
      if(room.phase==='fight' && room.world){stepWorld(room.world);if(room.world.phase==='finished'){
        const winner=room.world.winner;
        if(winner){const ball=room.world.balls.find(ball=>ball.id===winner);if(ball)room.score[ball.team]++;}
        room.phase='round_result';room.deadline=room.clock+5*60;
      }}
      if(room.phase==='round_result' && room.clock>=room.deadline){if(room.score.some(x=>x>=this.winsToMatch)||room.round>=9)room.phase='match_result';else this.nextRound(room);}
      if(room.phase==='abandoned' && room.clock-room.idle>=30*60)this.deleteRoom(room);
      if(room.phase==='match_result' && room.clock-room.idle>=10*60*60)this.deleteRoom(room);
    }
  }
  private expire(room:Room,player:string){
    room.disconnected.delete(player);
    if(room.phase==='lobby' || room.mode==='bot'){this.leave(player);return;}
    this.membership.delete(player);
    room.forfeited.add(player);
    room.ready.delete(player);
    room.idle=room.clock;
    if(!room.players.some(p=>!p.startsWith('bot:')&&!room.forfeited.has(p))){this.deleteRoom(room);return;}
    const index=room.players.indexOf(player);
    if(room.phase==='fight' && room.world)room.world.balls[index].hp=0;
    else if(room.phase==='select'){
      room.picks[player]??=room.offers[player][0];
      room.angles[player]??=index%2===0?0:Math.PI;
      if(room.players.every(p=>room.picks[p])){
        if(room.players.every(p=>room.angles[p]!==undefined))this.startFight(room);else this.beginAim(room);
      }
    }else if(room.phase==='aim'){
      room.angles[player]=index%2===0?0:Math.PI;
      if(room.players.every(p=>room.angles[p]!==undefined))this.startFight(room);
    }
    if(room.mode==='1v1' && room.phase!=='match_result'){
      room.score[index%2===0?1:0]=this.winsToMatch;
      room.phase='match_result';
      room.world=null;
    }
  }
  private deleteRoom(room:Room){for(const p of room.players)this.membership.delete(p);this.rooms.delete(room.code);}
  leave(player:string):void {
    const code=this.membership.get(player);if(!code)return;
    const room=this.rooms.get(code)!;room.players=room.players.filter(p=>p!==player);room.ready.delete(player);room.disconnected.delete(player);this.membership.delete(player);room.idle=room.clock;
    if(!room.players.some(p=>!p.startsWith('bot:')))this.deleteRoom(room);else if(room.phase!=='lobby')room.phase='abandoned';
  }
  snapshot(player:string){
    const room=this.forPlayer(player),world=room.world;
    return {code:room.code,mode:room.mode,slot:room.players.indexOf(player),phase:room.phase,round:room.round,score:[...room.score],deadline:room.deadline?room.deadline-room.clock:0,
      offer:room.offers[player]??[],pick:room.picks[player]??null,angleLocked:room.angles[player]!==undefined,collectionUsed:room.collectionUsed.has(player),rematchReady:room.rematch.size,rematchAvailable:room.forfeited.size===0,
      players:room.players.map((id,slot)=>({ready:room.ready.has(id),chosen:!!room.picks[id],connected:!room.disconnected.has(id)&&!room.forfeited.has(id),bot:id.startsWith('bot:'),team:slot%2})),
      world:world?{tick:world.tick,seed:world.seed,phase:world.phase,balls:world.balls.map(b=>({...b})),winner:world.winner,reason:world.reason,hits:world.hits,events:world.events.map(e=>({...e})),projectiles:world.projectiles.map(p=>({...p})),contacts:[...world.contacts],collisionLimitHits:world.collisionLimitHits}:null};
  }
}
