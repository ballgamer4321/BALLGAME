import { describe, expect, it } from 'vitest';
import { MATCH_BALLS, RULES } from '../src/shared/config';
import { createWorld, stepWorld } from '../src/simulation/world';

const duel = (a: string, b = 'jade') => createWorld(11, [a, b], [0, Math.PI]);
const advance = (world: ReturnType<typeof duel>, count: number) => {
  for (let i = 0; i < count && world.phase === 'running'; i++) stepWorld(world);
};

describe('available ball abilities', () => {
  it('all definitions describe a trigger and a different power', () => {
    expect(MATCH_BALLS).toHaveLength(16);
    expect(new Set(MATCH_BALLS.map(ball => ball.ability)).size).toBe(16);
    expect(MATCH_BALLS.every(ball => ball.trigger && ball.ability && ball.weakness)).toBe(true);
    expect(['blade', 'axe', 'burst', 'charge', 'glass', 'machine-gun', 'poison-spike', 'spider', 'thief']
      .every(id => MATCH_BALLS.some(ball => ball.id === id))).toBe(true);
    expect(MATCH_BALLS.some(ball => ['beam', 'violet', 'amber', 'machine', 'gold'].includes(ball.id))).toBe(false);
  });

  it('does not revive a retired power from an old local pick', () => {
    const world = duel('amber', 'beam');
    expect(world.balls.map(ball => ball.abilityId)).toEqual([null, null]);
  });

  it('Żmija poisons once per contact and poison expires', () => {
    const world = duel('jade', 'laser');
    const [a, b] = world.balls;
    a.x = -a.radius; b.x = b.radius; a.y = b.y = 0;
    a.vx = 1; b.vx = -1; a.vy = b.vy = 0;
    stepWorld(world);
    expect(b.poisonedUntil).toBeGreaterThan(world.tick);
    a.x = -7; b.x = 7; a.vx = b.vx = a.vy = b.vy = 0;
    const hp = b.hp;
    advance(world, 61);
    expect(b.hp).toBe(hp - 2);
    advance(world, 180);
    const expiredHp = b.hp;
    advance(world, 70);
    expect(b.hp).toBe(expiredHp);
  });

  it('poison uses three independent stacks and does not add a fourth', () => {
    const world = duel('jade', 'laser');
    const [jade, target] = world.balls;
    for (let contact = 0; contact < 4; contact++) {
      jade.x = -jade.radius; target.x = target.radius; jade.y = target.y = 0;
      jade.vx = 1; target.vx = -1; jade.vy = target.vy = 0;
      stepWorld(world);
      jade.x = -7; target.x = 7; jade.vx = target.vx = jade.vy = target.vy = 0;
      advance(world, 30);
    }
    expect(target.poisonStacks).toHaveLength(3);
    expect(new Set(target.poisonStacks.map(stack => stack.expiresAt)).size).toBe(3);
    advance(world, 181);
    expect(target.poisonStacks).toHaveLength(0);
  });

  it('Bastion shield absorbs damage then expires', () => {
    const world = duel('steel', 'orange');
    const [a, b] = world.balls;
    a.vx = b.vx = a.vy = b.vy = 0;
    stepWorld(world);
    expect(a.shield).toBe(12);
    a.x = -a.radius; b.x = b.radius; a.y = b.y = 0; a.vx = 1; b.vx = -1;
    stepWorld(world);
    expect(a.hp).toBe(a.maxHp);
    expect(a.shield).toBe(3);
    a.x = -7; b.x = 7; a.vx = b.vx = 0;
    advance(world, 122);
    expect(a.shield).toBe(0);
  });

  it('Szron slows a nearby enemy temporarily', () => {
    const world = duel('cyan', 'laser');
    const [a, b] = world.balls;
    a.x = -1.7; b.x = 1.7; a.y = b.y = 0;
    a.vx = 0; a.vy = 0; b.vx = 8; b.vy = 0;
    stepWorld(world);
    expect(b.slowedUntil).toBeGreaterThan(world.tick);
    expect(b.vx).toBeCloseTo(8 * 0.6);
    expect(b.hp).toBe(b.maxHp - 6);
    advance(world, 151);
    expect(b.slowedUntil).toBe(0);
  });

  it('Siewca launches a projectile after a wall bounce', () => {
    const world = duel('orange', 'jade');
    const [a, b] = world.balls;
    a.x = RULES.width / 2 - a.radius - 0.01; a.y = 0;
    a.vx = 8; a.vy = 0; b.x = 5; b.y = 0; b.vx = b.vy = 0;
    stepWorld(world);
    expect(world.events.some(event => event.type === 'shot')).toBe(true);
    expect(world.projectiles).toHaveLength(1);
    advance(world, 30);
    expect(b.hp).toBeLessThan(b.maxHp);
  });

  it('Echo creates a satellite that strikes once and expires', () => {
    const world = duel('pink', 'laser');
    const [a, b] = world.balls;
    // Keep the target inside Echo's 3-unit strike radius but outside contact.
    a.x = -1.4; b.x = 1.4; a.y = b.y = 0;
    a.vx = b.vx = a.vy = b.vy = 0;
    stepWorld(world);
    expect(a.echoUntil).toBeGreaterThan(world.tick);
    stepWorld(world);
    expect(a.echoHit).toBe(true);
    expect(b.hp).toBe(b.maxHp - 8);
    advance(world, 121);
    expect(a.echoUntil).toBeLessThanOrEqual(world.tick);
  });

  it('Laser leaves a damaging barrier that expires', () => {
    const world = duel('laser', 'jade');
    const [a, b] = world.balls;
    a.x = RULES.width / 2 - a.radius - 0.01; a.y = 0; a.vx = 8; a.vy = 0;
    b.x = 5.5; b.y = 0; b.vx = b.vy = 0;
    stepWorld(world);
    expect(world.lasers).toHaveLength(1);
    expect(world.lasers[0].axis).toBe('x');
    expect(b.hp).toBe(b.maxHp - 4);
    a.x = -5; b.x = 5.5; a.vx = a.vy = b.vx = b.vy = 0;
    advance(world, 480);
    expect(world.lasers).toHaveLength(0);
  });

  it('Salwa fires a three-projectile spread at a wall bounce', () => {
    const world = duel('cannon', 'jade');
    const [a, b] = world.balls;
    a.x = RULES.width / 2 - a.radius - 0.01; a.y = 0; a.vx = 8; a.vy = 0;
    b.x = 5.5; b.y = 0; b.vx = b.vy = 0;
    stepWorld(world);
    expect(world.projectiles).toHaveLength(3);
    expect(world.projectiles.every(shot => shot.damage === 4 && shot.color === '#ff745d')).toBe(true);
    expect(new Set(world.projectiles.map(shot => Math.round(Math.atan2(shot.vy, shot.vx) * 100))).size).toBe(3);
  });

  it('Pajęczak web slows once and restores exact speed', () => {
    const world = duel('spider', 'jade');
    const [a, b] = world.balls;
    a.x = RULES.width / 2 - a.radius - 0.01; a.y = 0; a.vx = 8; a.vy = 0;
    b.x = 5.5; b.y = 0; b.vx = 6; b.vy = 0;
    stepWorld(world);
    expect(world.webs).toHaveLength(1);
    expect(b.slowedUntil).toBeGreaterThan(world.tick);
    expect(b.vx).toBeCloseTo(6 * 0.7);
    const hpInsideWeb = b.hp;
    advance(world, 30);
    expect(b.hp).toBe(hpInsideWeb - 1);
    a.x = -8; a.vx = a.vy = 0; b.x = -8; b.y = -7; b.vx = 6; b.vy = 0;
    b.slowEffects = []; b.slowFactor = 1; b.slowedUntil = 0;
    advance(world, 90);
    expect(Math.abs(b.vx)).toBeCloseTo(6);
  });

  it('Topór no longer adds its blade damage to an ordinary ball collision', () => {
    const world = duel('axe', 'jade');
    const [a, b] = world.balls;
    a.hp = 50;
    a.axeAngle = Math.PI;
    a.x = -a.radius; b.x = b.radius; a.y = b.y = 0;
    a.vx = 1; b.vx = -1; a.vy = b.vy = 0;
    stepWorld(world);
    expect(b.hp).toBe(b.maxHp - a.damage);
  });

  it('krążące ostrze trafia poza zasięgiem zwykłego zderzenia i przyspiesza przy niskim HP', () => {
    const world = duel('axe', 'jade');
    const [axe, target] = world.balls;
    axe.x = -4; axe.y = 0; axe.vx = axe.vy = 0;
    target.x = axe.x + Math.cos(4.65) * 3; target.y = axe.y + Math.sin(4.65) * 3;
    target.vx = target.vy = 0;
    expect(Math.hypot(target.x - axe.x, target.y - axe.y)).toBeGreaterThan(axe.radius + target.radius);
    const angleAtFullHealth = axe.axeAngle;
    advance(world, 60);
    expect(target.hp).toBe(target.maxHp - 12);
    expect(axe.axeAngle - angleAtFullHealth).toBeCloseTo(Math.PI * 2 * 0.7, 1);

    const lowHpWorld = duel('axe', 'jade');
    const [lowHpAxe, lowHpTarget] = lowHpWorld.balls;
    lowHpAxe.x = -4; lowHpAxe.y = 0; lowHpAxe.vx = lowHpAxe.vy = 0;
    lowHpTarget.x = lowHpAxe.x + Math.cos(4.65) * 3;
    lowHpTarget.y = lowHpAxe.y + Math.sin(4.65) * 3;
    lowHpTarget.vx = lowHpTarget.vy = 0;
    lowHpAxe.hp = lowHpAxe.maxHp / 2;
    advance(lowHpWorld, 60);
    expect(lowHpTarget.hp).toBeLessThan(lowHpTarget.maxHp);
    expect(lowHpAxe.axeAngle).toBeCloseTo(Math.PI * 2 * 1.25 - Math.PI * 2, 1);
  });

  it('Blade grows on schedule and its orbiting blade deals independent damage', () => {
    const world = duel('blade', 'steel');
    const [blade, target] = world.balls;
    blade.x = -4; blade.y = 0; blade.vx = blade.vy = 0;
    target.x = -1; target.y = 0; target.vx = target.vy = 0;
    stepWorld(world);
    expect(target.hp).toBe(target.maxHp - 6);
    expect(blade.bladeCount).toBe(1);
    advance(world, 239);
    expect(blade.bladeCount).toBe(2);
  });

  it('Burst aims before a locked straight dash and deals its hit once', () => {
    const world = duel('burst', 'laser');
    const [burst, target] = world.balls;
    burst.x = -5; burst.y = target.y = 0; burst.vx = burst.vy = 0;
    target.x = 0; target.vx = target.vy = 0;
    stepWorld(world);
    expect(burst.burstAimUntil).toBeGreaterThan(world.tick);
    advance(world, 21);
    expect(burst.dashUntil).toBeGreaterThan(world.tick);
    expect(Math.hypot(burst.vx, burst.vy)).toBe(20);
    advance(world, 8);
    expect(target.hp).toBe(target.maxHp - 16);
    expect(burst.dashArmed).toBe(false);
  });

  it('Burst keeps an active slow during the dash and after it ends', () => {
    const world = duel('burst', 'laser');
    const [burst, target] = world.balls;
    burst.x = -6; burst.y = -6; burst.vx = burst.vy = 0;
    target.x = 6; target.y = 6; target.vx = target.vy = 0;
    burst.slowEffects = [{ source: 'test', factor: 0.6, expiresAt: 500 }];
    burst.slowFactor = 0.6;

    stepWorld(world);
    advance(world, 21);
    expect(Math.hypot(burst.vx, burst.vy)).toBeCloseTo(12);
    advance(world, 27);
    expect(burst.dashUntil).toBe(0);
    expect(Math.hypot(burst.vx, burst.vy)).toBeCloseTo(burst.normalSpeed * 0.6);
  });

  it('Charge increases contact damage only after a full second and resets on hit', () => {
    const world = duel('charge', 'laser');
    const [charge, target] = world.balls;
    charge.x = -charge.radius; target.x = target.radius; charge.y = target.y = 0;
    charge.vx = 1; target.vx = -1; charge.vy = target.vy = 0;
    stepWorld(world);
    expect(target.hp).toBe(target.maxHp - 4);
    charge.x = -5; target.x = 5; charge.vx = target.vx = charge.vy = target.vy = 0;
    advance(world, 60);
    charge.x = -charge.radius; target.x = target.radius; charge.y = target.y = 0;
    stepWorld(world);
    expect(target.hp).toBe(target.maxHp - 11);
    expect(charge.chargeStartedAt).toBeGreaterThan(0);
  });

  it('Glass emits six shards and one burst cannot hit the same target more than three times', () => {
    const world = duel('glass', 'laser');
    const [glass, target] = world.balls;
    glass.x = RULES.width / 2 - glass.radius - 0.01; glass.y = -7; glass.vx = 8; glass.vy = 0;
    target.x = -7; target.y = 7; target.vx = target.vy = 0;
    stepWorld(world);
    expect(world.projectiles).toHaveLength(6);
    expect(world.projectiles.every(shot => shot.burstId !== undefined)).toBe(true);

    world.projectiles = Array.from({ length: 6 }, (_, index) => ({
      x: 1, y: 0, vx: 0, vy: 0, owner: 0, ttl: 30, damage: 3, radius: 0.2, color: '#b7f2ed', burstId: 777 + index,
    }));
    world.shardHitCounts = { '777': {}, '778': {}, '779': {}, '780': {}, '781': {}, '782': {} };
    for (const shot of world.projectiles) shot.burstId = 777;
    target.x = 1; target.y = 0;
    const hp = target.hp;
    stepWorld(world);
    expect(target.hp).toBe(hp - 9);
  });

  it('Machine Gun fires a 15-shot magazine then reloads', () => {
    const world = duel('machine-gun', 'steel');
    const [gun, target] = world.balls;
    gun.x = -7; gun.y = 0; gun.vx = gun.vy = 0;
    target.x = 7; target.y = 0; target.vx = target.vy = 0;
    advance(world, 170);
    expect(gun.machineAmmo).toBe(0);
    expect(gun.machineReloadUntil - world.tick).toBeGreaterThan(0);
    expect(gun.machineReloadUntil - world.tick).toBeLessThanOrEqual(90);
    expect(target.hp).toBeLessThan(target.maxHp);
    advance(world, 88);
    expect(gun.machineAmmo).toBe(0);
    advance(world, 1);
    expect(gun.machineAmmo).toBe(14);
    expect(gun.machineReloadUntil).toBe(0);
  });

  it('Poison Spike is limited per wall bounce, hurts once and applies poison', () => {
    const world = duel('poison-spike', 'laser');
    const [spikeBall, target] = world.balls;
    spikeBall.x = RULES.width / 2 - spikeBall.radius - 0.01; spikeBall.y = 0;
    spikeBall.vx = 8; spikeBall.vy = 0;
    target.x = 8; target.y = 7; target.vx = target.vy = 0;
    stepWorld(world);
    expect(world.spikes).toHaveLength(1);
    target.x = world.spikes[0].x; target.y = world.spikes[0].y;
    target.x = -7; target.y = 0;
    world.spikes[0].x = -7; world.spikes[0].y = 0;
    const hp = target.hp;
    stepWorld(world);
    expect(world.spikes).toHaveLength(0);
    expect(target.hp).toBe(hp - 4);
    expect(target.poisonStacks).toHaveLength(1);
  });

  it('Thief knives speed up as HP falls and hit a target', () => {
    const world = duel('thief', 'laser');
    const [thief, target] = world.balls;
    thief.x = -7; thief.y = 0; thief.vx = thief.vy = 0;
    target.x = 7; target.y = 0; target.vx = target.vy = 0;
    stepWorld(world);
    expect(world.projectiles[0].damage).toBe(5);
    advance(world, 60);
    expect(target.hp).toBeLessThan(target.maxHp);
    thief.hp = thief.maxHp * 0.2;
    thief.abilityReadyAt = world.tick;
    stepWorld(world);
    expect(thief.abilityReadyAt - world.tick).toBeLessThanOrEqual(24);
  });

  it('every pair finishes within the limit without invalid physics', () => {
    for (const first of MATCH_BALLS) for (const second of MATCH_BALLS) {
      const world = createWorld(17, [first.id, second.id]);
      while (world.phase === 'running') stepWorld(world);
      expect(world.tick).toBeLessThanOrEqual(RULES.maxTicks);
      expect(world.hits).toBeGreaterThan(0);
      expect(world.collisionLimitHits).toBe(0);
      expect(world.balls.every(ball => Number.isFinite(ball.hp) && Number.isFinite(ball.x) && Number.isFinite(ball.y))).toBe(true);
    }
  });
});
