import { BASIC_BALLS, MATCH_BALLS, RULES } from '../shared/config.js';
import { seededRandom } from '../shared/random.js';

export interface Ball {
  id: string; x: number; y: number; vx: number; vy: number;
  form: 'standard' | 'cell-minion';
  team: 0 | 1;
  radius: number; hp: number; maxHp: number; damage: number; normalSpeed: number;
  abilityId: string | null; shield: number; shieldUntil: number;
  poisonedUntil: number; poisonTick: number; poisonStacks: { expiresAt: number; nextDamageAt: number }[];
  burnUntil: number; burnNextDamageAt: number;
  slowedUntil: number; slowFactor: number; slowEffects: { source: string; factor: number; expiresAt: number }[];
  stunnedUntil: number; controlImmuneUntil: number; stunVx: number; stunVy: number;
  dashUntil: number; dashArmed: boolean; echoUntil: number; echoHit: boolean;
  burstAimUntil: number; burstDirection: number; chargeStartedAt: number;
  machineAmmo: number; machineReloadUntil: number; machineNextShotAt: number;
  bladeCount: number; bladeNextGrowAt: number; bladeAngle: number; bladeNextHitAt: number[];
  glassNextBurstAt: number; contactNextHitAt: Record<string, number>;
  abilityReadyAt: number; beamChargeUntil: number; beamUntil: number; beamNextDamageAt: number;
  axeAngle: number; axeNextHitAt: number[];
  vampireTargetId: string | null; vampireUntil: number; vampireNextPulseAt: number; vampirePulsesLeft: number;
  cellGrowthLevel: number; cellNextGrowAt: number; cellSplitTriggered: boolean;
  snakeHistory: { x: number; y: number }[]; snakeSegments: { x: number; y: number }[];
  snakeSegmentCount: number; snakeNextGrowAt: number; snakeNextHitAt: number[];
  appleNextDropAt: number;
  chessPhase: 'idle' | 'travel' | 'aim' | 'attack'; chessPhaseUntil: number;
  chessStartX: number; chessStartY: number; chessSavedVx: number; chessSavedVy: number;
  chessPattern: 'rook' | 'bishop' | 'knight' | null; chessPath: ChessPathSegment[];
  diceNextDropAt: number; iceNextBombAt: number;
  reforgeActive: boolean; reforgeDamage: number; reforgeAngle: number; reforgeTouching: boolean; reforgeNextHitAt: number[];
}
export interface ChessPathSegment { x1: number; y1: number; x2: number; y2: number; }
export interface BattleEvent { type: 'wall' | 'hit' | 'impact' | 'power' | 'beam' | 'shot' | 'damage'; x: number; y: number; color?: string; radius?: number; axis?: 'x' | 'y'; angle?: number; weapon?: string; owner?: number; elevation?: number; amount?: number; }
export interface Projectile { x: number; y: number; vx: number; vy: number; owner: number; ttl: number; damage?: number; radius?: number; color?: string; weapon?: string; burstId?: number; kind?: 'hook' | 'ice'; slowFactor?: number; slowDuration?: number; }
export interface LaserLine { axis: 'x' | 'y'; at: number; start: number; end: number; owner: number; color: string; ttl: number; warningUntil: number; nextHitAt: Record<string, number>; }
export interface WebTrap { x: number; y: number; owner: number; radius: number; color: string; ttl: number; createdAt: number; hitSlots: number[]; nextDamageAt: Record<string, number>; }
export interface SpikeTrap { x: number; y: number; owner: number; radius: number; color: string; ttl: number; }
export interface DiceTrap { x: number; y: number; owner: number; id: number; value: number; ttl: number; nextHitAt: Record<string, number>; }
export interface IceBomb { x: number; y: number; owner: number; id: number; detonateAt: number; color: string; }
export interface DamageZone { x: number; y: number; owner: number; radius: number; color: string; ttl: number; nextDamageAt: Record<string, number>; }
export interface ApplePickup { x: number; y: number; owner: number; id: number; ttl: number; color: string; }
export interface HookTether { owner: number; target: number; expiresAt: number; angle: number; radius: number; }
export interface World {
  seed: number; tick: number; phase: 'running' | 'finished';
  balls: Ball[]; contacts: Set<string>; events: BattleEvent[];
  winner: string | null; reason: 'knockout' | 'timeout' | null;
  hits: number; collisionLimitHits: number;
  projectiles: Projectile[];
  lasers: LaserLine[]; webs: WebTrap[]; spikes: SpikeTrap[]; damageZones: DamageZone[]; apples: ApplePickup[];
  diceTraps: DiceTrap[]; iceBombs: IceBomb[]; hookTethers: HookTether[]; nextHazardId: number;
  shardHitCounts: Record<string, Record<string, number>>; nextShardBurstId: number;
}

const ticks = (seconds: number) => Math.round(seconds / RULES.step);

export function createWorld(seed = 1, picks?: string[], angles?: number[]): World {
  const random = seededRandom(seed);
  // Openings intersect close to the centre, then the collision changes both paths.
  const targetY = (random() - 0.5) * 3;
  const defs = picks ? picks.map(id => MATCH_BALLS.find(ball => ball.id === id) ?? MATCH_BALLS[0]) : BASIC_BALLS;
  const balls = defs.map((def, i) => {
    const team = i % 2 as 0 | 1;
    const x = team === 0 ? -6 : 6;
    const y = defs.length > 2 ? (Math.floor(i / 2) === 0 ? -3 : 3) : (random() - 0.5) * 5;
    const angle = angles?.[i] ?? Math.atan2(targetY - y, -x);
    return { id: picks ? `${i}:${def.id}` : def.id, x, y, vx: Math.cos(angle) * def.speed,
      vy: Math.sin(angle) * def.speed, radius: def.radius, team,
      hp: def.hp, maxHp: def.hp, damage: def.damage, normalSpeed: def.speed,
      abilityId: picks && MATCH_BALLS.some(ball => ball.id === picks[i]) ? def.id : null, shield: 0, shieldUntil: 0,
      poisonedUntil: 0, poisonTick: 0, poisonStacks: [], burnUntil: 0, burnNextDamageAt: 0,
      slowedUntil: 0, slowFactor: 1, slowEffects: [], stunnedUntil: 0, controlImmuneUntil: 0, stunVx: 0, stunVy: 0,
      dashUntil: 0, dashArmed: false, echoUntil: 0, echoHit: false,
      burstAimUntil: 0, burstDirection: 0, chargeStartedAt: 0,
      machineAmmo: 15, machineReloadUntil: 0, machineNextShotAt: 0,
      bladeCount: 1, bladeNextGrowAt: ticks(4), bladeAngle: 0, bladeNextHitAt: Array(defs.length).fill(0),
      glassNextBurstAt: 0, contactNextHitAt: {},
      abilityReadyAt: def.id === 'chess' ? ticks(5) : 0, beamChargeUntil: 0, beamUntil: 0, beamNextDamageAt: 0,
      axeAngle: 0, axeNextHitAt: Array(defs.length).fill(0), form: 'standard' as const,
      vampireTargetId: null, vampireUntil: 0, vampireNextPulseAt: 0, vampirePulsesLeft: 0,
      cellGrowthLevel: 0, cellNextGrowAt: ticks(5), cellSplitTriggered: false,
      snakeHistory: [{ x, y }], snakeSegments: [], snakeSegmentCount: 1, snakeNextGrowAt: ticks(3),
      snakeNextHitAt: Array(defs.length).fill(0), appleNextDropAt: ticks(2.5),
      chessPhase: 'idle' as const, chessPhaseUntil: 0, chessStartX: 0, chessStartY: 0, chessSavedVx: 0, chessSavedVy: 0,
      chessPattern: null, chessPath: [], diceNextDropAt: ticks(2), iceNextBombAt: 0,
      reforgeActive: false, reforgeDamage: 3, reforgeAngle: 0, reforgeTouching: false, reforgeNextHitAt: Array(defs.length).fill(0) };
  });
  return { seed, tick: 0, phase: 'running', balls, contacts: new Set(),
    events: [], winner: null, reason: null, hits: 0, collisionLimitHits: 0, projectiles: [], lasers: [], webs: [], spikes: [], damageZones: [], apples: [],
    diceTraps: [], iceBombs: [], hookTethers: [], nextHazardId: 1,
    shardHitCounts: {}, nextShardBurstId: 1 };
}

const EPS = 1e-9;
const pairKey = (a: Ball, b: Ball) => [a.id, b.id].sort().join(':');
const kind = (ball: Ball) => ball.abilityId;
const other = (w: World, ball: Ball) => w.balls.filter(candidate => candidate.team !== ball.team && candidate.hp > 0)
  .sort((a, b) => Math.hypot(a.x-ball.x,a.y-ball.y)-Math.hypot(b.x-ball.x,b.y-ball.y))[0];

function damage(w: World, ball: Ball, amount: number, color?: string) {
  if (ball.hp <= 0 || ball.chessPhase === 'travel' || amount <= 0) return 0;
  const absorbed = Math.min(ball.shield, amount);
  ball.shield -= absorbed;
  const hpBefore = ball.hp;
  ball.hp = Math.max(0, ball.hp - (amount - absorbed));
  const hpLost = hpBefore - ball.hp;
  if (hpLost > EPS) w.events.push({ type: 'damage', x: ball.x, y: ball.y, amount: hpLost });
  if (color) w.events.push({ type: 'power', x: ball.x, y: ball.y, color, radius: ball.radius + 0.4 });
  return hpLost;
}

function applyPoison(w: World, ball: Ball, color = '#76dd9a') {
  if (ball.hp <= 0 || ball.poisonStacks.length >= 3) return;
  ball.poisonStacks.push({ expiresAt: w.tick + ticks(3), nextDamageAt: w.tick + ticks(0.5) });
  ball.poisonedUntil = Math.max(ball.poisonedUntil, w.tick + ticks(3));
  ball.poisonTick = Math.min(ball.poisonTick || Number.MAX_SAFE_INTEGER, w.tick + ticks(0.5));
  w.events.push({ type: 'power', x: ball.x, y: ball.y, color, radius: ball.radius + 0.5 });
}

function applyBurn(w: World, ball: Ball, color = '#ff7044') {
  if (ball.hp <= 0) return;
  ball.burnUntil = w.tick + ticks(3);
  ball.burnNextDamageAt = Math.min(ball.burnNextDamageAt || Number.MAX_SAFE_INTEGER, w.tick + ticks(1));
  w.events.push({ type: 'power', x: ball.x, y: ball.y, color, radius: ball.radius + 0.45 });
}

function refreshSlow(ball: Ball, now: number) {
  ball.slowEffects = ball.slowEffects.filter(effect => effect.expiresAt > now);
  const factor = Math.max(0.6, Math.min(1, ...ball.slowEffects.map(effect => effect.factor)));
  if (Math.abs(factor - ball.slowFactor) > EPS) {
    const ratio = factor / Math.max(0.6, ball.slowFactor);
    ball.vx *= ratio; ball.vy *= ratio;
    ball.slowFactor = factor;
  }
  ball.slowedUntil = ball.slowEffects.reduce((latest, effect) => Math.max(latest, effect.expiresAt), 0);
}

function applySlow(w: World, ball: Ball, source: string, factor: number, duration: number) {
  const existing = ball.slowEffects.find(effect => effect.source === source);
  if (existing) {
    existing.factor = Math.min(existing.factor, Math.max(0.6, factor));
    existing.expiresAt = Math.max(existing.expiresAt, w.tick + ticks(duration));
  } else {
    ball.slowEffects.push({ source, factor: Math.max(0.6, factor), expiresAt: w.tick + ticks(duration) });
  }
  refreshSlow(ball, w.tick);
}

function applyStun(w: World, ball: Ball, duration: number, color: string) {
  if (ball.hp <= 0 || w.tick < ball.controlImmuneUntil || w.tick < ball.stunnedUntil) return false;
  ball.stunVx = ball.vx; ball.stunVy = ball.vy;
  ball.vx = 0; ball.vy = 0;
  ball.stunnedUntil = w.tick + ticks(duration);
  ball.controlImmuneUntil = ball.stunnedUntil + ticks(2);
  w.events.push({ type: 'power', x: ball.x, y: ball.y, color, radius: ball.radius + 0.6 });
  return true;
}

function updateStatuses(w: World) {
  for (const ball of w.balls) {
    if (ball.stunnedUntil && w.tick >= ball.stunnedUntil) {
      ball.vx = ball.stunVx; ball.vy = ball.stunVy;
      ball.stunnedUntil = 0; ball.stunVx = 0; ball.stunVy = 0;
    }
    refreshSlow(ball, w.tick);
    ball.poisonedUntil = ball.poisonStacks.reduce((latest, stack) => Math.max(latest, stack.expiresAt), 0);
    ball.poisonTick = ball.poisonStacks.reduce((next, stack) => Math.min(next, stack.nextDamageAt), Number.MAX_SAFE_INTEGER);
    if (ball.poisonTick === Number.MAX_SAFE_INTEGER) ball.poisonTick = 0;
  }
}

function activateWallPower(w: World, ball: Ball, axis: 'x' | 'y') {
  const enemy = other(w, ball);
  if (!enemy) return;
  if (kind(ball) === 'glass') {
    spawnGlassShards(w, ball);
  } else if (kind(ball) === 'poison-spike') {
    if (w.tick < ball.abilityReadyAt) return;
    ball.abilityReadyAt = w.tick + ticks(0.7);
    const owner = w.balls.indexOf(ball);
    const owned = w.spikes.filter(spike => spike.owner === owner);
    if (owned.length >= 8) w.spikes.splice(w.spikes.indexOf(owned[0]), 1);
    w.spikes.push({ x: ball.x, y: ball.y, owner, radius: 0.42, color: '#8fd174', ttl: ticks(12) });
    w.events.push({ type: 'power', x: ball.x, y: ball.y, color: '#8fd174', radius: 0.9 });
  } else if (kind(ball) === 'zone') {
    if (w.tick < ball.abilityReadyAt) return;
    ball.abilityReadyAt = w.tick + ticks(4);
    const owner = w.balls.indexOf(ball);
    const owned = w.damageZones.filter(zone => zone.owner === owner);
    if (owned.length >= 1) w.damageZones.splice(w.damageZones.indexOf(owned[0]), 1);
    w.damageZones.push({ x: ball.x, y: ball.y, owner, radius: 3.4, color: '#ef9664', ttl: ticks(5), nextDamageAt: {} });
    w.events.push({ type: 'power', x: ball.x, y: ball.y, color: '#ef9664', radius: 3.4 });
  } else if (w.tick < ball.abilityReadyAt) return;
  else if (kind(ball) === 'violet') {
    ball.abilityReadyAt = w.tick + ticks(3);
    const nearLine = axis === 'x' ? Math.abs(enemy.y - ball.y) < 2.2 : Math.abs(enemy.x - ball.x) < 2.2;
    if (nearLine) damage(w, enemy, 7, '#c3a0fa');
    w.events.push({ type: 'beam', x: ball.x, y: ball.y, color: '#c3a0fa', axis });
  } else if (kind(ball) === 'orange') {
    ball.abilityReadyAt = w.tick + ticks(4);
    fireProjectiles(w, ball, enemy, { speed: 15, damage: 7, radius: 0.2, color: '#ff9566', ttl: 1.6 });
  } else if (kind(ball) === 'laser') {
    ball.abilityReadyAt = w.tick + ticks(1.5);
    const owner = w.balls.indexOf(ball), side = Math.sign(axis === 'x' ? ball.x : ball.y) || 1;
    const wall = side * (axis === 'x' ? RULES.width : RULES.height) / 2;
    const line: LaserLine = { axis, at: axis === 'x' ? ball.y : ball.x, start: wall,
      end: wall - side * 12, owner, color: '#f05cff', warningUntil: w.tick + ticks(0.4), ttl: ticks(4.4), nextHitAt: {} };
    const owned = w.lasers.filter(laser => laser.owner === owner);
    if (owned.length >= 3) w.lasers.splice(w.lasers.indexOf(owned[0]), 1);
    w.lasers.push(line);
    w.events.push({ type: 'beam', x: ball.x, y: ball.y, color: '#f05cff', axis });
  } else if (kind(ball) === 'reforge' && !ball.reforgeActive) {
    ball.reforgeActive = true;
    ball.reforgeDamage = 3;
    ball.reforgeTouching = false;
    w.events.push({ type: 'power', x: ball.x, y: ball.y, color: '#ffb86b', radius: 1.8 });
  } else if (kind(ball) === 'spider') {
    ball.abilityReadyAt = w.tick + ticks(1);
    const owner = w.balls.indexOf(ball);
    const owned = w.webs.filter(web => web.owner === owner);
    if (owned.length >= 4) w.webs.splice(w.webs.indexOf(owned[0]), 1);
    w.webs.push({ x: ball.x, y: ball.y, owner, radius: 3, color: '#a9f775', ttl: ticks(6), createdAt: w.tick, hitSlots: [], nextDamageAt: {} });
    w.events.push({ type: 'power', x: ball.x, y: ball.y, color: '#a9f775', radius: 3 });
  } else if (kind(ball) === 'cannon') {
    ball.abilityReadyAt = w.tick + ticks(3.4);
    fireProjectiles(w, ball, enemy, { speed: 13.5, damage: 4, radius: 0.24, color: '#ff745d', ttl: 1.8, spread: 0.2, count: 3 });
  }
}

function spawnGlassShards(w: World, ball: Ball) {
  if (w.tick < ball.glassNextBurstAt) return;
  ball.glassNextBurstAt = w.tick + ticks(1.2);
  const owner = w.balls.indexOf(ball);
  const burstId = w.nextShardBurstId++;
  w.shardHitCounts[String(burstId)] = {};
  for (let shard = 0; shard < 6 && w.projectiles.length < 32; shard++) {
    const angle = shard / 6 * Math.PI * 2;
    w.projectiles.push({ x: ball.x + Math.cos(angle) * ball.radius * 0.82, y: ball.y + Math.sin(angle) * ball.radius * 0.82,
      vx: Math.cos(angle) * 13, vy: Math.sin(angle) * 13, owner, ttl: ticks(1.5), damage: 3, radius: 0.14,
      color: '#b7f2ed', weapon: 'glass', burstId });
  }
  w.events.push({ type: 'shot', x: ball.x, y: ball.y, color: '#b7f2ed', radius: 1.4,
    weapon: 'glass', owner, elevation: ball.radius + 0.14 });
}

function fireProjectiles(w: World, ball: Ball, enemy: Ball, options: { speed: number; damage: number; radius: number; color: string; ttl: number; spread?: number; count?: number; kind?: Projectile['kind']; slowFactor?: number; slowDuration?: number }) {
  const dx = enemy.x - ball.x, dy = enemy.y - ball.y;
  const angle = Math.atan2(dy, dx), count = options.count ?? 1, spread = options.spread ?? 0;
  const owner = w.balls.indexOf(ball);
  const weapon = ball.abilityId ?? options.kind ?? 'projectile';
  for (let shot = 0; shot < count && w.projectiles.length < 32; shot++) {
    const offset = count === 1 ? 0 : (shot - (count - 1) / 2) * spread;
    const heading = angle + offset;
    const lateral = count > 1 ? (shot - (count - 1) / 2) * 0.3
      : weapon === 'machine-gun' ? (ball.machineAmmo % 2 ? -0.22 : 0.22)
        : weapon === 'thief' ? (Math.floor(w.tick / ticks(0.5)) % 2 ? -0.22 : 0.22) : 0;
    const weaponReach = weapon === 'thief' || weapon === 'hook' ? 1.82 : 1.45;
    const muzzleDistance = Math.max(ball.radius + 0.14, weaponReach);
    const x = ball.x + Math.cos(angle) * muzzleDistance - Math.sin(angle) * lateral;
    const y = ball.y + Math.sin(angle) * muzzleDistance + Math.cos(angle) * lateral;
    w.projectiles.push({ x, y, vx: Math.cos(heading) * options.speed,
      vy: Math.sin(heading) * options.speed, owner, ttl: ticks(options.ttl),
      damage: options.damage, radius: options.radius, color: options.color, weapon, kind: options.kind,
      slowFactor: options.slowFactor, slowDuration: options.slowDuration });
    w.events.push({ type: 'shot', x, y, angle: heading, color: options.color, radius: options.radius,
      weapon, owner, elevation: ball.radius + 0.14 });
  }
}

function emitProjectileImpact(w: World, shot: Projectile, target: Ball, x: number, y: number) {
  w.events.push({ type: 'impact', x, y, color: shot.color ?? '#ff9566', radius: shot.radius ?? 0.2,
    angle: Math.atan2(shot.vy, shot.vx), weapon: shot.weapon ?? shot.kind ?? 'projectile', owner: shot.owner,
    elevation: target.radius + 0.04 });
}

function releaseContacts(w: World) {
  for (let i = 0; i < w.balls.length; i++) {
    for (let j = i + 1; j < w.balls.length; j++) {
      const a = w.balls[i], b = w.balls[j];
      if (Math.hypot(a.x - b.x, a.y - b.y) > a.radius + b.radius + RULES.contactRelease)
        w.contacts.delete(pairKey(a, b));
    }
  }
}

function constrain(b: Ball) {
  b.x = Math.max(-RULES.width / 2 + b.radius, Math.min(RULES.width / 2 - b.radius, b.x));
  b.y = Math.max(-RULES.height / 2 + b.radius, Math.min(RULES.height / 2 - b.radius, b.y));
}

function applyContactAttack(w: World, attacker: Ball, target: Ball, allowKnockoutCounter = false) {
  if ((!allowKnockoutCounter && attacker.hp <= 0) || target.hp <= 0 || attacker.team === target.team ||
      attacker.chessPhase === 'travel' || target.chessPhase === 'travel') return;
  if (kind(attacker) === 'vampire') {
    if (!attacker.vampireTargetId && w.tick >= attacker.abilityReadyAt) {
      attacker.vampireTargetId = target.id;
      attacker.vampireUntil = w.tick + ticks(1.2);
      attacker.vampireNextPulseAt = w.tick;
      attacker.vampirePulsesLeft = 3;
      attacker.abilityReadyAt = w.tick + ticks(4);
      w.events.push({ type: 'power', x: attacker.x, y: attacker.y, color: '#b64c71', radius: attacker.radius + 0.7 });
    }
    return;
  }
  if (kind(attacker) === 'electric') {
    if (w.tick >= attacker.abilityReadyAt) {
      attacker.abilityReadyAt = w.tick + ticks(2.5);
      damage(w, target, 8, '#ffe46c');
      applyStun(w, target, 0.35, '#ffe46c');
      w.hits++;
    }
    return;
  }
  const nextAllowed = attacker.contactNextHitAt[target.id] ?? 0;
  if (w.tick < nextAllowed) return;
  const source = kind(attacker);
  const interval = source === 'charge' || source === 'cell' ? 0.8 : 0.5;
  let amount = attacker.damage;
  if (source === 'charge') amount = Math.min(25, 4 + 3 * Math.floor(Math.max(0, w.tick - attacker.chargeStartedAt) / ticks(1)));
  if (source === 'cell') amount = 5;
  if (source === 'burst') amount = attacker.dashArmed ? 16 : 0;
  if (amount <= 0) return;
  attacker.contactNextHitAt[target.id] = w.tick + ticks(interval);
  damage(w, target, amount);
  if (source === 'charge') attacker.chargeStartedAt = w.tick;
  if (source === 'burst' && attacker.dashArmed) {
    attacker.dashArmed = false;
    const distance = Math.hypot(target.x - attacker.x, target.y - attacker.y) || 1;
    target.vx += (target.x - attacker.x) / distance * 5;
    target.vy += (target.y - attacker.y) / distance * 5;
  }
  if (source === 'jade') applyPoison(w, target);
}

function updateSustainedContacts(w: World) {
  for (let i = 0; i < w.balls.length; i++) for (let j = i + 1; j < w.balls.length; j++) {
    const a = w.balls[i], b = w.balls[j];
    if (a.team === b.team || a.hp <= 0 || b.hp <= 0 || Math.hypot(a.x - b.x, a.y - b.y) > a.radius + b.radius + 0.01) continue;
    applyContactAttack(w, a, b);
    applyContactAttack(w, b, a);
  }
}

function resolvePair(w: World, a: Ball, b: Ball) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const d = Math.hypot(dx, dy), radius = a.radius + b.radius;
  const nx = d > EPS ? dx / d : 1, ny = d > EPS ? dy / d : 0;
  const overlap = radius - d;
  if (overlap > 0) {
    a.x -= nx * overlap / 2; a.y -= ny * overlap / 2;
    b.x += nx * overlap / 2; b.y += ny * overlap / 2;
    constrain(a); constrain(b);
  }
  const relative = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
  if (relative < 0) {
    // Arcade rebound: reflect each velocity across the contact normal.
    // This separates the balls without draining speed from either one.
    const aNormal = a.vx * nx + a.vy * ny;
    const bNormal = b.vx * nx + b.vy * ny;
    a.vx -= 2 * aNormal * nx; a.vy -= 2 * aNormal * ny;
    b.vx -= 2 * bNormal * nx; b.vy -= 2 * bNormal * ny;
  }
  const key = pairKey(a, b);
  if (!w.contacts.has(key)) {
    w.contacts.add(key);
    if (a.team !== b.team) {
      w.hits++;
      w.events.push({ type: 'hit', x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
      if (kind(a) === 'glass') spawnGlassShards(w, a);
      if (kind(b) === 'glass') spawnGlassShards(w, b);
    }
  }
  applyContactAttack(w, a, b, true);
  applyContactAttack(w, b, a, true);
}

type Impact = { time: number; a: Ball; axis?: 'x' | 'y'; b?: Ball };

function advance(w: World, dt: number) {
  for (const b of w.balls) if (b.hp > 0 && b.chessPhase !== 'travel') { b.x += b.vx * dt; b.y += b.vy * dt; }
  releaseContacts(w);
}

function integrate(w: World) {
  let remaining: number = RULES.step;
  const tethered = new Set(w.hookTethers.map(tether => tether.target));
  for (let count = 0; remaining > EPS; count++) {
    if (count >= RULES.maxImpacts) {
      // Drop remaining displacement rather than tunnel when the safety budget is exhausted.
      w.collisionLimitHits++;
      break;
    }
    releaseContacts(w);
    let earliest: Impact | undefined;
    const consider = (impact: Impact) => {
      if (impact.time >= -EPS && impact.time <= remaining + EPS &&
          (!earliest || impact.time < earliest.time))
        earliest = { ...impact, time: Math.max(0, impact.time) };
    };
    for (const a of w.balls) {
      if(a.hp<=0)continue;
      constrain(a);
      for (const axis of ['x', 'y'] as const) {
        const velocity = axis === 'x' ? a.vx : a.vy;
        const half = (axis === 'x' ? RULES.width : RULES.height) / 2 - a.radius;
        if (Math.abs(velocity) > EPS)
          consider({ time: ((velocity > 0 ? half : -half) - a[axis]) / velocity, a, axis });
      }
    }
    for (let i = 0; i < w.balls.length; i++) {
      for (let j = i + 1; j < w.balls.length; j++) {
        const a = w.balls[i], b = w.balls[j];
        if(a.hp<=0 || b.hp<=0 || a.chessPhase === 'travel' || b.chessPhase === 'travel' || tethered.has(i) || tethered.has(j))continue;
        const dx = b.x - a.x, dy = b.y - a.y;
        const vx = b.vx - a.vx, vy = b.vy - a.vy;
        const radius = a.radius + b.radius;
        const c = dx * dx + dy * dy - radius * radius;
        const dot = dx * vx + dy * vy;
        const speedSq = vx * vx + vy * vy;
        if (c <= EPS) {
          if (dot < -EPS || !w.contacts.has(pairKey(a, b)))
            consider({ time: 0, a, b });
        } else if (dot < 0 && speedSq > EPS) {
          const discriminant = dot * dot - speedSq * c;
          if (discriminant >= 0)
            consider({ time: (-dot - Math.sqrt(discriminant)) / speedSq, a, b });
        }
      }
    }
    if (!earliest) { advance(w, remaining); break; }
    const impact: Impact = earliest;
    advance(w, impact.time);
    remaining -= impact.time;
    if (impact.b) {
      resolvePair(w, impact.a, impact.b);
      if (new Set(w.balls.filter(b=>b.hp>0).map(b=>b.team)).size < 2) break;
    } else {
      if (impact.axis === 'x') impact.a.vx *= -1;
      else impact.a.vy *= -1;
      activateWallPower(w, impact.a, impact.axis!);
      w.events.push({ type: 'wall', x: impact.a.x, y: impact.a.y });
    }
  }
}

function chessAttackPath(pattern: 'rook' | 'bishop' | 'knight', dx: number, dy: number): ChessPathSegment[] {
  const horizontal = Math.abs(dx) >= Math.abs(dy);
  const sx = Math.sign(dx) || 1, sy = Math.sign(dy) || 1;
  if (pattern === 'rook') return horizontal
    ? [{ x1: 0, y1: 0, x2: sx * (RULES.width / 2), y2: 0 }]
    : [{ x1: 0, y1: 0, x2: 0, y2: sy * (RULES.height / 2) }];
  if (pattern === 'bishop') return [{ x1: 0, y1: 0, x2: sx * 9.4, y2: sy * 9.4 }];
  return [
    { x1: 0, y1: 0, x2: sx * 3.2, y2: 0 },
    { x1: sx * 3.2, y1: 0, x2: sx * 3.2, y2: sy * 1.6 },
  ];
}

function updateChess(w: World, ball: Ball, owner: number) {
  if (ball.chessPhase === 'idle') {
    if (w.tick < ball.abilityReadyAt) return;
    ball.chessPhase = 'travel';
    ball.chessPhaseUntil = w.tick + ticks(0.45);
    ball.chessStartX = ball.x; ball.chessStartY = ball.y;
    ball.chessSavedVx = ball.vx; ball.chessSavedVy = ball.vy;
    ball.vx = 0; ball.vy = 0;
    return;
  }
  if (ball.chessPhase === 'travel') {
    const duration = ticks(0.45);
    const progress = Math.max(0, Math.min(1, 1 - (ball.chessPhaseUntil - w.tick) / duration));
    ball.x = ball.chessStartX * (1 - progress);
    ball.y = ball.chessStartY * (1 - progress);
    if (w.tick < ball.chessPhaseUntil) return;
    const target = other(w, ball);
    if (!target) { ball.chessPhase = 'idle'; ball.vx = ball.chessSavedVx; ball.vy = ball.chessSavedVy; return; }
    const roll = seededRandom((w.seed + Math.imul(w.tick + 1, 31) + owner * 97) >>> 0)();
    ball.chessPattern = roll < 1 / 3 ? 'rook' : roll < 2 / 3 ? 'bishop' : 'knight';
    ball.chessPath = chessAttackPath(ball.chessPattern, target.x - ball.x, target.y - ball.y);
    ball.chessPhase = 'aim'; ball.chessPhaseUntil = w.tick + ticks(0.6);
    w.events.push({ type: 'power', x: ball.x, y: ball.y, color: '#e2d4af', radius: 2.4 });
    return;
  }
  if (ball.chessPhase === 'aim') {
    if (w.tick < ball.chessPhaseUntil) return;
    for (const target of w.balls) {
      if (target.hp <= 0 || target.team === ball.team) continue;
      const hit = ball.chessPath.some(path => distanceToSegment(target.x, target.y, path.x1, path.y1, path.x2, path.y2) <= target.radius + 0.3);
      if (hit) { damage(w, target, 18, '#e2d4af'); w.hits++; }
    }
    ball.chessPhase = 'attack'; ball.chessPhaseUntil = w.tick + ticks(0.25);
    ball.abilityReadyAt = w.tick + ticks(5);
    w.events.push({ type: 'hit', x: ball.x, y: ball.y, color: '#e2d4af', radius: 1.1 });
    return;
  }
  if (ball.chessPhase === 'attack' && w.tick >= ball.chessPhaseUntil) {
    ball.chessPhase = 'idle'; ball.chessPattern = null; ball.chessPath = [];
    ball.vx = ball.chessSavedVx; ball.vy = ball.chessSavedVy;
  }
}

function rollDie(seed: number, tick: number, id: number) {
  return 1 + Math.floor(seededRandom((seed ^ Math.imul(tick + 1, 0x45d9f3b) ^ Math.imul(id + 1, 0x27d4eb2d)) >>> 0)() * 6);
}

function updateVampireLeeches(w: World) {
  for (const vampire of w.balls) {
    if (vampire.hp <= 0 || !vampire.vampireTargetId) continue;
    const target = w.balls.find(ball => ball.id === vampire.vampireTargetId);
    if (!target || target.hp <= 0 || w.tick >= vampire.vampireUntil) {
      if (target?.hp && target.hp > 0) {
        const distance = Math.hypot(target.x - vampire.x, target.y - vampire.y) || 1;
        target.vx += (target.x - vampire.x) / distance * 2.4;
        target.vy += (target.y - vampire.y) / distance * 2.4;
      }
      vampire.vampireTargetId = null; vampire.vampirePulsesLeft = 0;
      continue;
    }
    if (vampire.vampirePulsesLeft > 0 && w.tick >= vampire.vampireNextPulseAt) {
      const hpLost = damage(w, target, 3, '#b64c71');
      vampire.hp = Math.min(vampire.maxHp, vampire.hp + hpLost);
      vampire.vampirePulsesLeft--;
      vampire.vampireNextPulseAt += ticks(0.4);
      w.events.push({ type: 'power', x: vampire.x, y: vampire.y, color: '#df7896', radius: vampire.radius + 0.45 });
    }
  }
}

function spawnCellMinions(w: World) {
  for (const parent of w.balls) {
    if (parent.abilityId !== 'cell' || parent.hp > 0 || parent.cellSplitTriggered) continue;
    parent.cellSplitTriggered = true;
    if (w.balls.length + 2 > 12) continue;
    const heading = Math.atan2(parent.vy, parent.vx);
    const health = 15 + parent.cellGrowthLevel * 2;
    for (const [index, offset] of [-0.7, 0.7].entries()) {
      const angle = heading + offset;
      const radius = 0.58, speed = parent.normalSpeed * 1.08;
      const minion: Ball = {
        ...parent, id: `${parent.id}:cell-${index}`, x: parent.x + Math.cos(angle) * 0.38,
        y: parent.y + Math.sin(angle) * 0.38, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        form: 'cell-minion', radius, hp: health, maxHp: health, damage: 3, normalSpeed: speed,
        abilityId: null, shield: 0, shieldUntil: 0, poisonStacks: [], poisonTick: 0, poisonedUntil: 0,
        burnUntil: 0, burnNextDamageAt: 0, slowEffects: [], slowFactor: 1, slowedUntil: 0,
        stunnedUntil: 0, controlImmuneUntil: 0, stunVx: 0, stunVy: 0, dashUntil: 0, dashArmed: false,
        vampireTargetId: null, vampireUntil: 0, vampirePulsesLeft: 0, vampireNextPulseAt: 0,
        chessPhase: 'idle', chessPhaseUntil: 0, chessPath: [], chessPattern: null,
        chessStartX: 0, chessStartY: 0, chessSavedVx: 0, chessSavedVy: 0,
        cellGrowthLevel: 0, cellNextGrowAt: 0, cellSplitTriggered: true,
        contactNextHitAt: {}, abilityReadyAt: 0, glassNextBurstAt: 0,
        bladeCount: 1, bladeNextGrowAt: 0, bladeAngle: 0, bladeNextHitAt: Array(w.balls.length + 2).fill(0),
        axeAngle: 0, axeNextHitAt: Array(w.balls.length + 2).fill(0),
        machineAmmo: 15, machineReloadUntil: 0, machineNextShotAt: 0,
        burstAimUntil: 0, burstDirection: 0, chargeStartedAt: 0, echoUntil: 0, echoHit: false,
        beamChargeUntil: 0, beamUntil: 0, beamNextDamageAt: 0,
        reforgeActive: false, reforgeDamage: 3, reforgeAngle: 0, reforgeTouching: false,
        reforgeNextHitAt: Array(w.balls.length + 2).fill(0), diceNextDropAt: 0, iceNextBombAt: 0,
      };
      constrain(minion);
      w.balls.push(minion);
    }
    w.events.push({ type: 'power', x: parent.x, y: parent.y, color: '#75d88d', radius: 2.1 });
  }
}

function timedPowers(w: World) {
  for (const [owner, ball] of w.balls.entries()) {
    if (ball.hp <= 0) continue;
    if (ball.shield && w.tick >= ball.shieldUntil) ball.shield = 0;
    if (ball.dashUntil && w.tick >= ball.dashUntil) {
      const speed = Math.hypot(ball.vx, ball.vy) || 1;
      const targetSpeed = kind(ball) === 'burst' ? ball.normalSpeed * ball.slowFactor : speed / 1.35;
      ball.vx = ball.vx / speed * targetSpeed; ball.vy = ball.vy / speed * targetSpeed;
      ball.dashUntil = 0; ball.dashArmed = false;
    }
    if (ball.machineReloadUntil && w.tick >= ball.machineReloadUntil) {
      ball.machineAmmo = 15; ball.machineReloadUntil = 0; ball.machineNextShotAt = w.tick;
    }
    for (const stack of ball.poisonStacks) {
      if (w.tick >= stack.nextDamageAt && w.tick <= stack.expiresAt) {
        damage(w, ball, 1, '#76dd9a'); stack.nextDamageAt += ticks(0.5);
      }
    }
    ball.poisonStacks = ball.poisonStacks.filter(stack => stack.expiresAt >= w.tick);
    ball.poisonedUntil = ball.poisonStacks.reduce((latest, stack) => Math.max(latest, stack.expiresAt), 0);
    ball.poisonTick = ball.poisonStacks.reduce((next, stack) => Math.min(next, stack.nextDamageAt), Number.MAX_SAFE_INTEGER);
    if (ball.poisonTick === Number.MAX_SAFE_INTEGER) ball.poisonTick = 0;
    if (ball.burnUntil && w.tick >= ball.burnNextDamageAt && w.tick <= ball.burnUntil) {
      damage(w, ball, 1, '#ff7044'); ball.burnNextDamageAt += ticks(1 / 3);
    }
    if (ball.burnUntil && w.tick >= ball.burnUntil) { ball.burnUntil = 0; ball.burnNextDamageAt = 0; }
    if (kind(ball) === 'cell' && ball.cellGrowthLevel < 5 && w.tick >= ball.cellNextGrowAt) {
      ball.cellGrowthLevel++;
      ball.cellNextGrowAt += ticks(5);
      ball.radius *= 1.08;
      constrain(ball);
      w.events.push({ type: 'power', x: ball.x, y: ball.y, color: '#75d88d', radius: ball.radius + 0.5 });
    }
    if (kind(ball) === 'chess') {
      updateChess(w, ball, owner);
      if (ball.chessPhase !== 'idle') continue;
    }
    if (kind(ball) === 'dice' && w.tick >= ball.diceNextDropAt) {
      const owned = w.diceTraps.filter(trap => trap.owner === owner);
      if (owned.length >= 5) w.diceTraps.splice(w.diceTraps.indexOf(owned[0]), 1);
      const id = w.nextHazardId++;
      w.diceTraps.push({ x: ball.x, y: ball.y, owner, id, value: rollDie(w.seed, w.tick, id), ttl: ticks(10), nextHitAt: {} });
      ball.diceNextDropAt = w.tick + ticks(2);
      w.events.push({ type: 'power', x: ball.x, y: ball.y, color: '#f0eee5', radius: 0.8 });
    }
    if (kind(ball) === 'ice-cone' && w.tick >= ball.iceNextBombAt) {
      const owned = w.iceBombs.filter(bomb => bomb.owner === owner);
      if (owned.length >= 2) w.iceBombs.splice(w.iceBombs.indexOf(owned[0]), 1);
      w.iceBombs.push({ x: ball.x, y: ball.y, owner, id: w.nextHazardId++, detonateAt: w.tick + ticks(1.5), color: '#9de7fa' });
      ball.iceNextBombAt = w.tick + ticks(3);
      w.events.push({ type: 'power', x: ball.x, y: ball.y, color: '#9de7fa', radius: 0.9 });
    }
    if (kind(ball) === 'apple' && w.tick >= ball.appleNextDropAt) {
      const owned = w.apples.filter(apple => apple.owner === owner);
      if (owned.length >= 4) w.apples.splice(w.apples.indexOf(owned[0]), 1);
      const speed = Math.hypot(ball.vx, ball.vy) || 1;
      const x = Math.max(-RULES.width / 2 + 0.6, Math.min(RULES.width / 2 - 0.6, ball.x - ball.vx / speed * 1.05));
      const y = Math.max(-RULES.height / 2 + 0.6, Math.min(RULES.height / 2 - 0.6, ball.y - ball.vy / speed * 1.05));
      w.apples.push({ x, y, owner, id: w.nextHazardId++, ttl: ticks(8), color: '#f26e69' });
      ball.appleNextDropAt = w.tick + ticks(2.5);
      w.events.push({ type: 'power', x, y, color: '#f26e69', radius: 0.8 });
    }
    const enemy = other(w, ball);
    if (!enemy) continue;
    if (kind(ball) === 'machine-gun') {
      if (ball.machineReloadUntil || w.tick < ball.machineNextShotAt) continue;
      if (ball.machineAmmo <= 0) { ball.machineReloadUntil = w.tick + ticks(1.5); continue; }
      fireProjectiles(w, ball, enemy, { speed: 32, damage: 2, radius: 0.12, color: '#ff9ee8', ttl: 1.1 });
      ball.machineAmmo--;
      ball.machineNextShotAt = w.tick + ticks(0.2);
      if (ball.machineAmmo === 0) ball.machineReloadUntil = w.tick + ticks(1.5);
      continue;
    }
    if (kind(ball) === 'thief') {
      if (w.tick < ball.abilityReadyAt) continue;
      const health = Math.max(0.2, ball.hp / ball.maxHp);
      const progress = Math.max(0, Math.min(1, (1 - health) / 0.8));
      const interval = 1.1 - progress * 0.7;
      ball.abilityReadyAt = w.tick + ticks(interval);
      fireProjectiles(w, ball, enemy, { speed: 17, damage: 5, radius: 0.16, color: '#d7a5f4', ttl: 1.5 });
      continue;
    }
    if (kind(ball) === 'hook') {
      if (w.tick < ball.abilityReadyAt || Math.hypot(enemy.x - ball.x, enemy.y - ball.y) > 12) continue;
      ball.abilityReadyAt = w.tick + ticks(4);
      fireProjectiles(w, ball, enemy, { speed: 18, damage: 5, radius: 0.2, color: '#c49a72', ttl: 12 / 18, kind: 'hook' });
      continue;
    }
    if (kind(ball) === 'burst') {
      if (ball.burstAimUntil && w.tick >= ball.burstAimUntil) {
        ball.burstAimUntil = 0;
        ball.dashUntil = w.tick + ticks(0.45);
        ball.dashArmed = true;
        ball.vx = Math.cos(ball.burstDirection) * 20 * ball.slowFactor;
        ball.vy = Math.sin(ball.burstDirection) * 20 * ball.slowFactor;
        w.events.push({ type: 'power', x: ball.x, y: ball.y, color: '#ffca77', radius: 2.5 });
      } else if (!ball.burstAimUntil && !ball.dashUntil && w.tick >= ball.abilityReadyAt) {
        ball.burstDirection = Math.atan2(enemy.y - ball.y, enemy.x - ball.x);
        ball.burstAimUntil = w.tick + ticks(0.35);
        ball.abilityReadyAt = w.tick + ticks(3);
        w.events.push({ type: 'power', x: ball.x, y: ball.y, color: '#ffca77', radius: 1.4 });
      }
      continue;
    }
    if (kind(ball) === 'beam') {
      if (ball.beamChargeUntil && w.tick >= ball.beamChargeUntil) {
        ball.beamChargeUntil = 0;
        ball.beamUntil = w.tick + ticks(1.05);
        ball.beamNextDamageAt = w.tick;
        w.events.push({ type: 'beam', x: ball.x, y: ball.y, color: '#48eaff' });
        const beamAngle = Math.atan2(enemy.y - ball.y, enemy.x - ball.x);
        const muzzle = ball.radius + 0.14;
        w.events.push({ type: 'shot', x: ball.x + Math.cos(beamAngle) * muzzle,
          y: ball.y + Math.sin(beamAngle) * muzzle, angle: beamAngle, color: '#48eaff',
          weapon: 'beam', owner, elevation: ball.radius + 0.14 });
      }
      if (ball.beamUntil > w.tick) {
        if (w.tick >= ball.beamNextDamageAt) {
          damage(w, enemy, 4, '#48eaff');
          ball.beamNextDamageAt = w.tick + ticks(0.24);
        }
        continue;
      }
      if (ball.beamChargeUntil || w.tick < ball.abilityReadyAt) continue;
      ball.beamChargeUntil = w.tick + ticks(0.82);
      ball.abilityReadyAt = w.tick + ticks(5.8);
      w.events.push({ type: 'power', x: ball.x, y: ball.y, color: '#48eaff', radius: 1.8 });
      continue;
    }
    if (kind(ball) === 'pink' && ball.echoUntil > w.tick && !ball.echoHit &&
        Math.hypot(enemy.x - ball.x, enemy.y - ball.y) < 3) {
      ball.echoHit = true;
      damage(w, enemy, 8, '#ff9dd5');
    }
    if (w.tick < ball.abilityReadyAt) continue;
    switch (kind(ball)) {
      case 'amber':
        ball.abilityReadyAt = w.tick + ticks(4);
        ball.dashUntil = w.tick + ticks(0.7); ball.dashArmed = true;
        ball.vx *= 1.35; ball.vy *= 1.35;
        w.events.push({ type: 'power', x: ball.x, y: ball.y, color: '#ffb866', radius: 2 });
        break;
      case 'steel':
        ball.abilityReadyAt = w.tick + ticks(5);
        ball.shield = 12; ball.shieldUntil = w.tick + ticks(2);
        w.events.push({ type: 'power', x: ball.x, y: ball.y, color: '#b8c9db', radius: 2 });
        break;
      case 'gold':
        ball.abilityReadyAt = w.tick + ticks(3);
        if (Math.hypot(enemy.x - ball.x, enemy.y - ball.y) <= 6) damage(w, enemy, 12, '#ffe382');
        w.events.push({ type: 'power', x: ball.x, y: ball.y, color: '#ffe382', radius: 6 });
        break;
      case 'cyan':
        ball.abilityReadyAt = w.tick + ticks(3);
        if (Math.hypot(enemy.x - ball.x, enemy.y - ball.y) <= 7) {
          applySlow(w, enemy, `cyan:${ball.id}`, 0.6, 2.5);
          damage(w, enemy, 6, '#82e9f4');
          w.events.push({ type: 'power', x: enemy.x, y: enemy.y, color: '#82e9f4', radius: 1.6 });
        }
        break;
      case 'pink':
        ball.abilityReadyAt = w.tick + ticks(6);
        ball.echoUntil = w.tick + ticks(2); ball.echoHit = false;
        w.events.push({ type: 'power', x: ball.x, y: ball.y, color: '#ff9dd5', radius: 2 });
        break;
      case 'machine':
        ball.abilityReadyAt = w.tick + ticks(1.15);
        fireProjectiles(w, ball, enemy, { speed: 19, damage: 4, radius: 0.17, color: '#ff9ee8', ttl: 1.25 });
        break;
    }
  }
}

function updateArenaHazards(w: World) {
  w.lasers = w.lasers.filter(laser => {
    laser.ttl--;
    for (let slot = 0; slot < w.balls.length; slot++) {
      const enemy = w.balls[slot];
      if (w.tick < laser.warningUntil || enemy.hp <= 0 || enemy.team === w.balls[laser.owner]?.team) continue;
      const distance = laser.axis === 'x'
        ? distanceToSegment(enemy.x, enemy.y, laser.start, laser.at, laser.end, laser.at)
        : distanceToSegment(enemy.x, enemy.y, laser.at, laser.start, laser.at, laser.end);
      if (distance > enemy.radius + 0.15 || (laser.nextHitAt[String(slot)] ?? 0) > w.tick) continue;
      damage(w, enemy, 6, laser.color);
      laser.nextHitAt[String(slot)] = w.tick + ticks(0.75);
      w.hits++;
    }
    return laser.ttl > 0 && !!w.balls[laser.owner];
  });
  w.webs = w.webs.filter(web => {
    web.ttl--;
    for (let slot = 0; slot < w.balls.length; slot++) {
      const enemy = w.balls[slot];
      if (enemy.hp <= 0 || enemy.team === w.balls[web.owner]?.team ||
          Math.hypot(enemy.x - web.x, enemy.y - web.y) > web.radius + enemy.radius * 0.35) continue;
      if (!web.hitSlots.includes(slot)) web.hitSlots.push(slot);
      applySlow(w, enemy, `web:${web.owner}:${web.createdAt}`, 0.7, 0.2);
      if (web.nextDamageAt[String(slot)] === undefined) {
        web.nextDamageAt[String(slot)] = w.tick + ticks(0.5);
      } else if (web.nextDamageAt[String(slot)] <= w.tick) {
        damage(w, enemy, 1, web.color);
        web.nextDamageAt[String(slot)] = w.tick + ticks(0.5);
      }
    }
    return web.ttl > 0 && !!w.balls[web.owner];
  });
  w.spikes = w.spikes.filter(spike => {
    spike.ttl--;
    for (let slot = 0; slot < w.balls.length; slot++) {
      const enemy = w.balls[slot];
      if (enemy.hp <= 0 || enemy.team === w.balls[spike.owner]?.team ||
          Math.hypot(enemy.x - spike.x, enemy.y - spike.y) > spike.radius + enemy.radius) continue;
      damage(w, enemy, 4, spike.color);
      applyPoison(w, enemy, spike.color);
      return false;
    }
    return spike.ttl > 0 && !!w.balls[spike.owner];
  });
  w.diceTraps = w.diceTraps.filter(trap => {
    trap.ttl--;
    for (let slot = 0; slot < w.balls.length; slot++) {
      const enemy = w.balls[slot];
      if (enemy.hp <= 0 || enemy.team === w.balls[trap.owner]?.team ||
          (trap.nextHitAt[String(slot)] ?? 0) > w.tick || Math.hypot(enemy.x - trap.x, enemy.y - trap.y) > enemy.radius + 0.52) continue;
      damage(w, enemy, trap.value, '#f0eee5');
      trap.value = rollDie(w.seed, w.tick, trap.id);
      trap.nextHitAt[String(slot)] = w.tick + ticks(0.8);
      w.hits++;
      w.events.push({ type: 'power', x: trap.x, y: trap.y, color: '#f0eee5', radius: 0.7 });
    }
    return trap.ttl > 0 && !!w.balls[trap.owner];
  });
  w.damageZones = w.damageZones.filter(zone => {
    zone.ttl--;
    for (let slot = 0; slot < w.balls.length; slot++) {
      const enemy = w.balls[slot];
      if (enemy.hp <= 0 || enemy.team === w.balls[zone.owner]?.team ||
          (zone.nextDamageAt[String(slot)] ?? 0) > w.tick || Math.hypot(enemy.x - zone.x, enemy.y - zone.y) > zone.radius) continue;
      damage(w, enemy, 2, zone.color);
      zone.nextDamageAt[String(slot)] = w.tick + ticks(0.5);
      w.hits++;
    }
    return zone.ttl > 0 && !!w.balls[zone.owner];
  });
  w.apples = w.apples.filter(apple => {
    apple.ttl--;
    for (const target of w.balls) {
      if (target.hp <= 0 || Math.hypot(target.x - apple.x, target.y - apple.y) > target.radius + 0.48) continue;
      if (target.team === w.balls[apple.owner]?.team) {
        if (target.hp >= target.maxHp) continue;
        target.hp = Math.min(target.maxHp, target.hp + 5);
        w.events.push({ type: 'power', x: apple.x, y: apple.y, color: '#9be680', radius: 0.9 });
      } else {
        damage(w, target, 7, apple.color);
        w.hits++;
      }
      return false;
    }
    return apple.ttl > 0 && !!w.balls[apple.owner];
  });
  for (const bomb of w.iceBombs) {
    if (w.tick < bomb.detonateAt) continue;
    const burstId = w.nextShardBurstId++;
    w.shardHitCounts[String(burstId)] = {};
    for (let shard = 0; shard < 8 && w.projectiles.length < 32; shard++) {
      const angle = shard / 8 * Math.PI * 2;
      w.projectiles.push({ x: bomb.x, y: bomb.y, vx: Math.cos(angle) * 14, vy: Math.sin(angle) * 14,
        owner: bomb.owner, ttl: ticks(1.25), damage: 4, radius: 0.18, color: bomb.color,
        weapon: 'ice', burstId, kind: 'ice', slowFactor: 0.75, slowDuration: 1 });
    }
    w.events.push({ type: 'power', x: bomb.x, y: bomb.y, color: bomb.color, radius: 2.3 });
  }
  w.iceBombs = w.iceBombs.filter(bomb => w.tick < bomb.detonateAt && !!w.balls[bomb.owner]);
}

function moveProjectiles(w: World) {
  w.projectiles = w.projectiles.filter(shot => {
    const x = shot.x, y = shot.y;
    shot.x += shot.vx * RULES.step; shot.y += shot.vy * RULES.step; shot.ttl--;
    const enemies = w.balls.filter(ball=>ball.team!==w.balls[shot.owner].team && ball.hp>0);
    if (!enemies.length) return false;
    const dx = shot.x - x, dy = shot.y - y;
    for(const enemy of enemies){
      const t = Math.max(0, Math.min(1, ((enemy.x - x) * dx + (enemy.y - y) * dy) / (dx * dx + dy * dy || 1)));
      if (Math.hypot(enemy.x - (x + t * dx), enemy.y - (y + t * dy)) <= enemy.radius + (shot.radius ?? 0.2)) {
        const impactX = x + t * dx, impactY = y + t * dy;
        if (shot.kind === 'hook') {
          const owner = w.balls[shot.owner];
          damage(w, enemy, shot.damage ?? 5, shot.color ?? '#c49a72');
          emitProjectileImpact(w, shot, enemy, impactX, impactY);
          if (owner?.hp && owner.hp > 0) {
            const orbitAngle = Math.atan2(enemy.y - owner.y, enemy.x - owner.x);
            w.hookTethers.push({ owner: shot.owner, target: w.balls.indexOf(enemy), expiresAt: w.tick + ticks(0.8),
              angle: orbitAngle, radius: owner.radius + enemy.radius + 0.2 });
          }
          w.hits++;
          return false;
        }
        if (shot.burstId !== undefined) {
          const group = w.shardHitCounts[String(shot.burstId)] ?? (w.shardHitCounts[String(shot.burstId)] = {});
          const count = group[enemy.id] ?? 0;
          group[enemy.id] = count + 1;
          if (count < 3) {
            damage(w, enemy, shot.damage ?? 3, shot.color ?? '#b7f2ed');
            emitProjectileImpact(w, shot, enemy, impactX, impactY);
            if (shot.kind === 'ice' && shot.slowFactor && shot.slowDuration)
              applySlow(w, enemy, `ice:${shot.burstId}`, shot.slowFactor, shot.slowDuration);
            w.hits++;
          }
        } else {
          damage(w, enemy, shot.damage ?? 7, shot.color ?? '#ff9566');
          emitProjectileImpact(w, shot, enemy, impactX, impactY);
          w.hits++;
        }
        return false;
      }
    }
    return shot.ttl > 0 && Math.abs(shot.x) <= RULES.width / 2 && Math.abs(shot.y) <= RULES.height / 2;
  });
  const activeBursts = new Set(w.projectiles.flatMap(shot => shot.burstId === undefined ? [] : [String(shot.burstId)]));
  for (const burstId of Object.keys(w.shardHitCounts)) if (!activeBursts.has(burstId)) delete w.shardHitCounts[burstId];
}

function updateHookTethers(w: World) {
  w.hookTethers = w.hookTethers.filter(tether => {
    const owner = w.balls[tether.owner], target = w.balls[tether.target];
    if (!owner || !target || owner.hp <= 0 || target.hp <= 0) return false;
    if (w.tick >= tether.expiresAt) {
      damage(w, target, 7, '#c49a72');
      const dx = target.x - owner.x, dy = target.y - owner.y, distance = Math.hypot(dx, dy) || 1;
      target.vx = owner.vx + dx / distance * 12;
      target.vy = owner.vy + dy / distance * 12;
      w.hits++;
      w.events.push({ type: 'power', x: target.x, y: target.y, color: '#c49a72', radius: 1 });
      return false;
    }
    tether.angle += Math.PI * 2 / 0.8 * RULES.step;
    target.x = owner.x + Math.cos(tether.angle) * tether.radius;
    target.y = owner.y + Math.sin(tether.angle) * tether.radius;
    target.vx = owner.vx - Math.sin(tether.angle) * tether.radius * (Math.PI * 2 / 0.8);
    target.vy = owner.vy + Math.cos(tether.angle) * tether.radius * (Math.PI * 2 / 0.8);
    constrain(target);
    return true;
  });
}

const axeCuttingEdge: readonly (readonly [number, number])[] = [
  [-0.57, -0.43], [-0.96, -0.55], [-1.14, -0.25], [-1.34, 0],
  [-1.14, 0.25], [-0.96, 0.55], [-0.57, 0.43],
];

const AXE_MODEL_SCALE = 1.28;

function updateBladeAttacks(w: World) {
  for (let ownerSlot = 0; ownerSlot < w.balls.length; ownerSlot++) {
    const blade = w.balls[ownerSlot];
    if (blade.hp <= 0 || kind(blade) !== 'blade') continue;
    while (blade.bladeCount < 5 && w.tick >= blade.bladeNextGrowAt) {
      blade.bladeCount++;
      blade.bladeNextGrowAt += ticks(4);
      w.events.push({ type: 'power', x: blade.x, y: blade.y, color: '#e9f2fa', radius: 1.7 });
    }
    const previousAngle = blade.bladeAngle;
    const angleStep = Math.PI * 2 * 0.8 * RULES.step;
    blade.bladeAngle = (previousAngle + angleStep) % (Math.PI * 2);
    const samples = Math.max(1, Math.ceil(angleStep / 0.08));
    for (let targetSlot = 0; targetSlot < w.balls.length; targetSlot++) {
      const target = w.balls[targetSlot];
      if (target.hp <= 0 || target.team === blade.team || (blade.bladeNextHitAt[targetSlot] ?? 0) > w.tick ||
          Math.hypot(target.x - blade.x, target.y - blade.y) <= blade.radius + target.radius) continue;
      let impact: { x: number; y: number } | null = null;
      for (let sample = 0; sample <= samples && !impact; sample++) {
        const angle = previousAngle + angleStep * sample / samples;
        for (let sword = 0; sword < blade.bladeCount; sword++) {
          const swordAngle = angle + sword / blade.bladeCount * Math.PI * 2;
          const x = blade.x + Math.cos(swordAngle) * 2.7;
          const y = blade.y + Math.sin(swordAngle) * 2.7;
          if (Math.hypot(target.x - x, target.y - y) <= target.radius + 0.4) { impact = { x, y }; break; }
        }
      }
      if (!impact) continue;
      blade.bladeNextHitAt[targetSlot] = w.tick + ticks(0.4);
      damage(w, target, 6, '#e9f2fa');
      w.hits++;
      w.events.push({ type: 'hit', x: impact.x, y: impact.y, color: '#e9f2fa', radius: 0.42, weapon: 'blade' });
      w.events.push({ type: 'impact', x: impact.x, y: impact.y, color: '#e9f2fa', radius: 0.32,
        angle: Math.atan2(target.y - blade.y, target.x - blade.x), weapon: 'blade', owner: ownerSlot, elevation: target.radius + 0.04 });
    }
  }
}

function axeEdgeAt(ball: Ball, angle: number, localX: number, localY: number) {
  // Match the rendered handle from (0.19, 0.98) to (0.56, 1.86),
  // then rotate its blade around the ball in the arena's x/y plane.
  const handleLength = Math.hypot(0.37, 0.88);
  const x = (0.56 - localX * 0.88 / handleLength + localY * 0.37 / handleLength) * AXE_MODEL_SCALE;
  const y = (1.86 + localX * 0.37 / handleLength + localY * 0.88 / handleLength) * AXE_MODEL_SCALE;
  const cosine = Math.cos(angle), sine = Math.sin(angle);
  return { x: ball.x + x * cosine - y * sine, y: ball.y + x * sine + y * cosine };
}

function distanceToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function updateAxeAttacks(w: World) {
  const cooldown = ticks(0.6);
  for (let ownerSlot = 0; ownerSlot < w.balls.length; ownerSlot++) {
    const axe = w.balls[ownerSlot];
    if (axe.hp <= 0 || kind(axe) !== 'axe') continue;
    const previousAngle = axe.axeAngle;
    const lostHp = Math.max(0, 1 - axe.hp / axe.maxHp);
    const spinRate = Math.PI * 2 * (0.7 + lostHp * 1.1);
    const angleStep = spinRate * RULES.step;
    axe.axeAngle = (previousAngle + angleStep) % (Math.PI * 2);

    // Substep the rotating edge so it cannot skip a ball between simulation ticks.
    const samples = Math.max(1, Math.ceil(angleStep / 0.06));
    for (let targetSlot = 0; targetSlot < w.balls.length; targetSlot++) {
      const target = w.balls[targetSlot];
      if (target.hp <= 0 || target.team === axe.team || (axe.axeNextHitAt[targetSlot] ?? 0) > w.tick) continue;
      let impact: { x: number; y: number } | null = null;
      for (let sample = 0; sample <= samples && !impact; sample++) {
        const angle = previousAngle + angleStep * sample / samples;
        for (let edge = 0; edge < axeCuttingEdge.length - 1; edge++) {
          const [ax, ay] = axeCuttingEdge[edge];
          const [bx, by] = axeCuttingEdge[edge + 1];
          const start = axeEdgeAt(axe, angle, ax, ay);
          const end = axeEdgeAt(axe, angle, bx, by);
          if (distanceToSegment(target.x, target.y, start.x, start.y, end.x, end.y) <= target.radius + 0.16) {
            impact = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
            break;
          }
        }
      }
      if (!impact) continue;
      axe.axeNextHitAt[targetSlot] = w.tick + cooldown;
      const damageAmount = 12;
      damage(w, target, damageAmount, '#dce5f2');
      w.hits++;
      w.events.push({ type: 'hit', x: impact.x, y: impact.y, color: '#dce5f2', radius: 0.58, weapon: 'axe' });
      w.events.push({ type: 'impact', x: impact.x, y: impact.y, color: '#dce5f2', radius: 0.38,
        angle: Math.atan2(target.y - axe.y, target.x - axe.x), weapon: 'axe', owner: ownerSlot, elevation: target.radius + 0.04 });
    }
  }
}

function updateReforgeAttacks(w: World) {
  for (const companion of w.balls) {
    if (companion.hp <= 0 || kind(companion) !== 'reforge' || !companion.reforgeActive) continue;
    const previousAngle = companion.reforgeAngle;
    const angleStep = Math.PI * 2 / 1.5 * RULES.step;
    companion.reforgeAngle = (previousAngle + angleStep) % (Math.PI * 2);
    const previousRadius = 2 + Math.cos(previousAngle) * 0.45;
    const radius = 2 + Math.cos(companion.reforgeAngle) * 0.45;
    const touching = radius <= companion.radius + 0.34;
    if (touching && !companion.reforgeTouching && companion.reforgeDamage < 11) {
      companion.reforgeDamage++;
      w.events.push({ type: 'power', x: companion.x, y: companion.y, color: '#ffb86b', radius: 1.6 });
    }
    companion.reforgeTouching = touching;
    const x1 = companion.x + Math.cos(previousAngle) * previousRadius;
    const y1 = companion.y + Math.sin(previousAngle) * previousRadius;
    const x2 = companion.x + Math.cos(companion.reforgeAngle) * radius;
    const y2 = companion.y + Math.sin(companion.reforgeAngle) * radius;
    for (let targetSlot = 0; targetSlot < w.balls.length; targetSlot++) {
      const target = w.balls[targetSlot];
      if (target.hp <= 0 || target.team === companion.team ||
          (companion.reforgeNextHitAt[targetSlot] ?? 0) > w.tick ||
          distanceToSegment(target.x, target.y, x1, y1, x2, y2) > target.radius + 0.38) continue;
      companion.reforgeNextHitAt[targetSlot] = w.tick + ticks(0.7);
      damage(w, target, companion.reforgeDamage, '#ffb86b');
      w.hits++;
      w.events.push({ type: 'hit', x: (x1 + x2) / 2, y: (y1 + y2) / 2, color: '#ffb86b', radius: 0.45 });
    }
  }
}

function updateSnakeTails(w: World) {
  for (const ball of w.balls) {
    if (kind(ball) !== 'snake' || ball.hp <= 0) continue;
    ball.snakeHistory.unshift({ x: ball.x, y: ball.y });
    if (ball.snakeHistory.length > 420) ball.snakeHistory.length = 420;
    if (ball.snakeSegmentCount < 10 && w.tick >= ball.snakeNextGrowAt) {
      ball.snakeSegmentCount++;
      ball.snakeNextGrowAt += ticks(3);
      w.events.push({ type: 'power', x: ball.x, y: ball.y, color: '#72d88c', radius: 1.2 });
    }
    ball.snakeSegments = Array.from({ length: ball.snakeSegmentCount }, (_, index) =>
      ball.snakeHistory[Math.min((index + 1) * 5, ball.snakeHistory.length - 1)] ?? { x: ball.x, y: ball.y });
    for (let slot = 0; slot < w.balls.length; slot++) {
      const target = w.balls[slot];
      if (target.hp <= 0 || target.team === ball.team || (ball.snakeNextHitAt[slot] ?? 0) > w.tick) continue;
      const segment = ball.snakeSegments.find(point => Math.hypot(target.x - point.x, target.y - point.y) <= target.radius + 0.3);
      if (!segment) continue;
      const dx = target.x - segment.x, dy = target.y - segment.y, distance = Math.hypot(dx, dy) || 1;
      ball.snakeNextHitAt[slot] = w.tick + ticks(0.5);
      damage(w, target, 4, '#72d88c');
      target.vx += dx / distance * 2.2;
      target.vy += dy / distance * 2.2;
      w.hits++;
      w.events.push({ type: 'impact', x: target.x, y: target.y, color: '#72d88c', radius: 0.34,
        angle: Math.atan2(dy, dx), weapon: 'snake', owner: w.balls.indexOf(ball), elevation: target.radius + 0.04 });
    }
  }
}

/** Mutates one world by exactly one simulation tick; independent of browser and renderer. */
export function stepWorld(w: World): void {
  if (w.phase === 'finished') return;
  w.events = [];
  updateStatuses(w);
  integrate(w);
  updateSustainedContacts(w);
  w.tick++;
  updateSnakeTails(w);
  updateStatuses(w);
  updateBladeAttacks(w);
  updateAxeAttacks(w);
  updateReforgeAttacks(w);
  timedPowers(w);
  updateArenaHazards(w);
  moveProjectiles(w);
  updateVampireLeeches(w);
  updateHookTethers(w);
  spawnCellMinions(w);
  if (w.tick > RULES.overtimeTick) {
    const damage = (4 + (w.tick - RULES.overtimeTick) * RULES.step * 0.6) * RULES.step;
    for (const b of w.balls) if (b.hp > 0) damageBallOvertime(w, b, damage);
  }
  const aliveTeams = new Set(w.balls.filter(b => b.hp > EPS).map(b => b.team));
  if (aliveTeams.size < 2 || w.tick >= RULES.maxTicks) {
    w.phase = 'finished';
    w.reason = aliveTeams.size < 2 ? 'knockout' : 'timeout';
    const scores = [0, 1].map(team => w.balls.filter(b => b.team === team).reduce((sum, b) => sum + b.hp / b.maxHp, 0));
    const delta = scores[0] - scores[1];
    w.winner = Math.abs(delta) <= EPS ? null : w.balls.find(b => b.team === (delta > 0 ? 0 : 1))!.id;
    w.balls.forEach(ball => { ball.hp = Math.max(0, ball.hp); });
  }
}

function damageBallOvertime(w: World, ball: Ball, amount: number) {
  const before = ball.hp;
  ball.hp = Math.max(0, ball.hp - amount);
  if (before - ball.hp >= 1) w.events.push({ type: 'damage', x: ball.x, y: ball.y, amount: before - ball.hp });
}
