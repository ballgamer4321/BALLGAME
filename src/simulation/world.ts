import { BASIC_BALLS, MATCH_BALLS, RULES } from '../shared/config.js';
import { seededRandom } from '../shared/random.js';

export interface Ball {
  id: string; x: number; y: number; vx: number; vy: number;
  team: 0 | 1;
  radius: number; hp: number; maxHp: number; damage: number;
  abilityId: string | null; shield: number; shieldUntil: number;
  poisonedUntil: number; poisonTick: number; slowedUntil: number;
  dashUntil: number; dashArmed: boolean; echoUntil: number; echoHit: boolean;
  abilityReadyAt: number; beamChargeUntil: number; beamUntil: number; beamNextDamageAt: number;
}
export interface BattleEvent { type: 'wall' | 'hit' | 'power' | 'beam' | 'shot' | 'damage'; x: number; y: number; color?: string; radius?: number; axis?: 'x' | 'y'; amount?: number; }
export interface Projectile { x: number; y: number; vx: number; vy: number; owner: number; ttl: number; damage?: number; radius?: number; color?: string; }
export interface LaserLine { axis: 'x' | 'y'; at: number; owner: number; color: string; ttl: number; nextHitAt: Record<string, number>; }
export interface WebTrap { x: number; y: number; owner: number; radius: number; color: string; ttl: number; hitSlots: number[]; }
export interface World {
  seed: number; tick: number; phase: 'running' | 'finished';
  balls: Ball[]; contacts: Set<string>; events: BattleEvent[];
  winner: string | null; reason: 'knockout' | 'timeout' | null;
  hits: number; collisionLimitHits: number;
  projectiles: Projectile[];
  lasers: LaserLine[]; webs: WebTrap[];
}

export function createWorld(seed = 1, picks?: string[], angles?: number[]): World {
  const random = seededRandom(seed);
  // Openings intersect close to the centre, then the collision changes both paths.
  const targetY = (random() - 0.5) * 3;
  const defs = picks ? picks.map(id => MATCH_BALLS.find(ball => ball.id === id) ?? BASIC_BALLS[0]) : BASIC_BALLS;
  const balls = defs.map((def, i) => {
    const team = i % 2 as 0 | 1;
    const x = team === 0 ? -6 : 6;
    const y = defs.length > 2 ? (Math.floor(i / 2) === 0 ? -3 : 3) : (random() - 0.5) * 5;
    const angle = angles?.[i] ?? Math.atan2(targetY - y, -x);
    return { id: picks ? `${i}:${def.id}` : def.id, x, y, vx: Math.cos(angle) * def.speed,
      vy: Math.sin(angle) * def.speed, radius: def.radius, team,
      hp: def.hp, maxHp: def.hp, damage: def.damage,
      abilityId: picks ? def.id : null, shield: 0, shieldUntil: 0,
      poisonedUntil: 0, poisonTick: 0, slowedUntil: 0,
      dashUntil: 0, dashArmed: false, echoUntil: 0, echoHit: false,
      abilityReadyAt: 0, beamChargeUntil: 0, beamUntil: 0, beamNextDamageAt: 0 };
  });
  return { seed, tick: 0, phase: 'running', balls, contacts: new Set(),
    events: [], winner: null, reason: null, hits: 0, collisionLimitHits: 0, projectiles: [], lasers: [], webs: [] };
}

const EPS = 1e-9;
const pairKey = (a: Ball, b: Ball) => [a.id, b.id].sort().join(':');
const ticks = (seconds: number) => Math.round(seconds / RULES.step);
const kind = (ball: Ball) => ball.abilityId;
const other = (w: World, ball: Ball) => w.balls.filter(candidate => candidate.team !== ball.team && candidate.hp > 0)
  .sort((a, b) => Math.hypot(a.x-ball.x,a.y-ball.y)-Math.hypot(b.x-ball.x,b.y-ball.y))[0];

function damage(w: World, ball: Ball, amount: number, color?: string) {
  if (ball.hp <= 0) return;
  const absorbed = Math.min(ball.shield, amount);
  ball.shield -= absorbed;
  const hpBefore = ball.hp;
  ball.hp = Math.max(0, ball.hp - (amount - absorbed));
  const hpLost = hpBefore - ball.hp;
  if (hpLost > EPS) w.events.push({ type: 'damage', x: ball.x, y: ball.y, amount: hpLost });
  if (color) w.events.push({ type: 'power', x: ball.x, y: ball.y, color, radius: ball.radius + 0.4 });
}

function activateWallPower(w: World, ball: Ball, axis: 'x' | 'y') {
  if (w.tick < ball.abilityReadyAt) return;
  const enemy = other(w, ball);
  if (!enemy) return;
  if (kind(ball) === 'violet') {
    ball.abilityReadyAt = w.tick + ticks(3);
    const nearLine = axis === 'x' ? Math.abs(enemy.y - ball.y) < 2.2 : Math.abs(enemy.x - ball.x) < 2.2;
    if (nearLine) damage(w, enemy, 7, '#c3a0fa');
    w.events.push({ type: 'beam', x: ball.x, y: ball.y, color: '#c3a0fa', axis });
  } else if (kind(ball) === 'orange') {
    ball.abilityReadyAt = w.tick + ticks(4);
    fireProjectiles(w, ball, enemy, { speed: 15, damage: 7, radius: 0.2, color: '#ff9566', ttl: 1.6 });
    w.events.push({ type: 'shot', x: ball.x, y: ball.y, color: '#ff9566' });
  } else if (kind(ball) === 'laser') {
    ball.abilityReadyAt = w.tick + ticks(3.3);
    w.lasers.push({ axis, at: axis === 'x' ? ball.y : ball.x, owner: w.balls.indexOf(ball), color: '#f05cff', ttl: ticks(8), nextHitAt: {} });
    if (w.lasers.length > 10) w.lasers.shift();
    w.events.push({ type: 'beam', x: ball.x, y: ball.y, color: '#f05cff', axis });
  } else if (kind(ball) === 'spider') {
    ball.abilityReadyAt = w.tick + ticks(3.6);
    w.webs.push({ x: ball.x, y: ball.y, owner: w.balls.indexOf(ball), radius: 2.8, color: '#a9f775', ttl: ticks(7), hitSlots: [] });
    if (w.webs.length > 10) w.webs.shift();
    w.events.push({ type: 'power', x: ball.x, y: ball.y, color: '#a9f775', radius: 2.8 });
  } else if (kind(ball) === 'cannon') {
    ball.abilityReadyAt = w.tick + ticks(3.4);
    fireProjectiles(w, ball, enemy, { speed: 13.5, damage: 4, radius: 0.24, color: '#ff745d', ttl: 1.8, spread: 0.2, count: 3 });
    w.events.push({ type: 'shot', x: ball.x, y: ball.y, color: '#ff745d' });
  }
}

function fireProjectiles(w: World, ball: Ball, enemy: Ball, options: { speed: number; damage: number; radius: number; color: string; ttl: number; spread?: number; count?: number }) {
  const dx = enemy.x - ball.x, dy = enemy.y - ball.y;
  const angle = Math.atan2(dy, dx), count = options.count ?? 1, spread = options.spread ?? 0;
  const owner = w.balls.indexOf(ball);
  for (let shot = 0; shot < count && w.projectiles.length < 32; shot++) {
    const offset = count === 1 ? 0 : (shot - (count - 1) / 2) * spread;
    const heading = angle + offset;
    w.projectiles.push({ x: ball.x, y: ball.y, vx: Math.cos(heading) * options.speed,
      vy: Math.sin(heading) * options.speed, owner, ttl: ticks(options.ttl),
      damage: options.damage, radius: options.radius, color: options.color });
  }
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
    // Resolve damage simultaneously, including a possible double knockout.
    const axeBonus = (ball: Ball) => kind(ball) === 'axe' ? Math.floor(12 * (1 - ball.hp / ball.maxHp)) : 0;
    const aDamage = a.damage + (a.dashArmed ? 8 : 0) + axeBonus(a);
    const bDamage = b.damage + (b.dashArmed ? 8 : 0) + axeBonus(b);
    if (a.team !== b.team) { damage(w, a, bDamage); damage(w, b, aDamage); }
    if (a.team !== b.team) {
      if (a.dashArmed) a.dashArmed = false;
      if (b.dashArmed) b.dashArmed = false;
    }
    if (a.team !== b.team && kind(a) === 'jade') { b.poisonedUntil = w.tick + ticks(3); b.poisonTick = w.tick + ticks(1); w.events.push({ type: 'power', x: b.x, y: b.y, color: '#76dd9a' }); }
    if (a.team !== b.team && kind(b) === 'jade') { a.poisonedUntil = w.tick + ticks(3); a.poisonTick = w.tick + ticks(1); w.events.push({ type: 'power', x: a.x, y: a.y, color: '#76dd9a' }); }
    if (a.team !== b.team) {
      w.hits++;
      w.events.push({ type: 'hit', x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
    }
  }
}

type Impact = { time: number; a: Ball; axis?: 'x' | 'y'; b?: Ball };

function advance(w: World, dt: number) {
  for (const b of w.balls) if (b.hp > 0) { b.x += b.vx * dt; b.y += b.vy * dt; }
  releaseContacts(w);
}

function integrate(w: World) {
  let remaining: number = RULES.step;
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
        if(a.hp<=0 || b.hp<=0)continue;
        const dx = b.x - a.x, dy = b.y - a.y;
        const vx = b.vx - a.vx, vy = b.vy - a.vy;
        const radius = a.radius + b.radius;
        const c = dx * dx + dy * dy - radius * radius;
        const dot = dx * vx + dy * vy;
        const speedSq = vx * vx + vy * vy;
        if (c <= EPS) {
          if (c < -EPS || dot < -EPS || !w.contacts.has(pairKey(a, b)))
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

function timedPowers(w: World) {
  for (const ball of w.balls) {
    if (ball.hp <= 0) continue;
    if (ball.shield && w.tick >= ball.shieldUntil) ball.shield = 0;
    if (ball.dashUntil && w.tick >= ball.dashUntil) {
      ball.vx /= 1.35; ball.vy /= 1.35; ball.dashUntil = 0; ball.dashArmed = false;
    }
    if (ball.slowedUntil && w.tick >= ball.slowedUntil) {
      ball.vx /= 0.5; ball.vy /= 0.5; ball.slowedUntil = 0;
    }
    if (ball.poisonedUntil && w.tick >= ball.poisonTick && w.tick <= ball.poisonedUntil) {
      damage(w, ball, 3, '#76dd9a'); ball.poisonTick += ticks(1);
    }
    const enemy = other(w, ball);
    if (!enemy) continue;
    if (kind(ball) === 'beam') {
      if (ball.beamChargeUntil && w.tick >= ball.beamChargeUntil) {
        ball.beamChargeUntil = 0;
        ball.beamUntil = w.tick + ticks(1.05);
        ball.beamNextDamageAt = w.tick;
        w.events.push({ type: 'beam', x: ball.x, y: ball.y, color: '#48eaff' });
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
        if (Math.hypot(enemy.x - ball.x, enemy.y - ball.y) <= 7 && enemy.slowedUntil <= w.tick) {
          enemy.vx *= 0.5; enemy.vy *= 0.5; enemy.slowedUntil = w.tick + ticks(2.5);
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
        w.events.push({ type: 'shot', x: ball.x, y: ball.y, color: '#ff9ee8' });
        break;
    }
  }
}

function updateArenaHazards(w: World) {
  w.lasers = w.lasers.filter(laser => {
    laser.ttl--;
    for (let slot = 0; slot < w.balls.length; slot++) {
      const enemy = w.balls[slot];
      if (enemy.hp <= 0 || enemy.team === w.balls[laser.owner]?.team) continue;
      const distance = laser.axis === 'x' ? Math.abs(enemy.y - laser.at) : Math.abs(enemy.x - laser.at);
      if (distance > enemy.radius + 0.15 || (laser.nextHitAt[String(slot)] ?? 0) > w.tick) continue;
      damage(w, enemy, 4, laser.color);
      laser.nextHitAt[String(slot)] = w.tick + ticks(1.15);
    }
    return laser.ttl > 0 && !!w.balls[laser.owner];
  });
  w.webs = w.webs.filter(web => {
    web.ttl--;
    for (let slot = 0; slot < w.balls.length; slot++) {
      const enemy = w.balls[slot];
      if (enemy.hp <= 0 || enemy.team === w.balls[web.owner]?.team || web.hitSlots.includes(slot) ||
          Math.hypot(enemy.x - web.x, enemy.y - web.y) > web.radius + enemy.radius * 0.35) continue;
      web.hitSlots.push(slot);
      if (enemy.slowedUntil <= w.tick) {
        enemy.vx *= 0.5; enemy.vy *= 0.5;
        enemy.slowedUntil = w.tick + ticks(1.5);
      } else {
        enemy.slowedUntil = Math.max(enemy.slowedUntil, w.tick + ticks(1.5));
      }
      damage(w, enemy, 6, web.color);
    }
    return web.ttl > 0 && !!w.balls[web.owner];
  });
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
        damage(w, enemy, shot.damage ?? 7, shot.color ?? '#ff9566'); return false;
      }
    }
    return shot.ttl > 0 && Math.abs(shot.x) <= RULES.width / 2 && Math.abs(shot.y) <= RULES.height / 2;
  });
}

/** Mutates one world by exactly one simulation tick; independent of browser and renderer. */
export function stepWorld(w: World): void {
  if (w.phase === 'finished') return;
  w.events = [];
  integrate(w);
  w.tick++;
  timedPowers(w);
  updateArenaHazards(w);
  moveProjectiles(w);
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
