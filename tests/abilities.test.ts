import { describe, expect, it } from 'vitest';
import { MATCH_BALLS, RULES } from '../src/shared/config';
import { createWorld, stepWorld } from '../src/simulation/world';

const duel = (a: string, b = 'jade') => createWorld(11, [a, b], [0, Math.PI]);
const advance = (world: ReturnType<typeof duel>, count: number) => {
  for (let i = 0; i < count && world.phase === 'running'; i++) stepWorld(world);
};

describe('fourteen distinct ball abilities', () => {
  it('all definitions describe a trigger and a different power', () => {
    expect(MATCH_BALLS).toHaveLength(14);
    expect(new Set(MATCH_BALLS.map(ball => ball.ability)).size).toBe(14);
    expect(MATCH_BALLS.every(ball => ball.trigger && ball.ability)).toBe(true);
  });

  it('Taran dashes and returns to base speed after the boost', () => {
    const world = duel('amber', 'steel');
    const ball = world.balls[0];
    const base = Math.hypot(ball.vx, ball.vy);
    stepWorld(world);
    expect(ball.dashArmed).toBe(true);
    expect(Math.hypot(ball.vx, ball.vy)).toBeGreaterThan(base);
    advance(world, 43);
    expect(ball.dashUntil).toBe(0);
  });

  it('Żmija poisons once per contact and poison expires', () => {
    const world = duel('jade', 'violet');
    const [a, b] = world.balls;
    a.x = -a.radius; b.x = b.radius; a.y = b.y = 0;
    a.vx = 1; b.vx = -1; a.vy = b.vy = 0;
    stepWorld(world);
    expect(b.poisonedUntil).toBeGreaterThan(world.tick);
    a.x = -7; b.x = 7; a.vx = b.vx = a.vy = b.vy = 0;
    const hp = b.hp;
    advance(world, 61);
    expect(b.hp).toBe(hp - 3);
    advance(world, 180);
    const expiredHp = b.hp;
    advance(world, 70);
    expect(b.hp).toBe(expiredHp);
  });

  it('Pryzmat fires a wall beam with cooldown', () => {
    const world = duel('violet', 'steel');
    const [a, b] = world.balls;
    a.x = RULES.width / 2 - a.radius - 0.01; a.y = b.y = 0;
    a.vx = 8; a.vy = 0; b.x = 0; b.vx = b.vy = 0;
    stepWorld(world);
    expect(b.hp).toBe(b.maxHp - 7);
    expect(world.events.some(event => event.type === 'beam')).toBe(true);
    expect(a.abilityReadyAt).toBeGreaterThan(world.tick);
  });

  it('Bastion shield absorbs damage then expires', () => {
    const world = duel('steel', 'violet');
    const [a, b] = world.balls;
    a.vx = b.vx = a.vy = b.vy = 0;
    stepWorld(world);
    expect(a.shield).toBe(12);
    a.x = -a.radius; b.x = b.radius; a.y = b.y = 0; a.vx = 1; b.vx = -1;
    stepWorld(world);
    expect(a.hp).toBe(a.maxHp);
    expect(a.shield).toBe(2);
    a.x = -7; b.x = 7; a.vx = b.vx = 0;
    advance(world, 122);
    expect(a.shield).toBe(0);
  });

  it('Pulsar damages a nearby target with a timed wave', () => {
    const world = duel('gold', 'steel');
    const [a, b] = world.balls;
    a.x = -1.5; b.x = 1.5; a.y = b.y = 0;
    a.vx = b.vx = a.vy = b.vy = 0;
    stepWorld(world);
    expect(b.hp).toBe(b.maxHp - 12);
    expect(world.events.some(event => event.type === 'power' && event.radius === 6)).toBe(true);
  });

  it('Szron slows a nearby enemy temporarily', () => {
    const world = duel('cyan', 'violet');
    const [a, b] = world.balls;
    a.x = -1.7; b.x = 1.7; a.y = b.y = 0;
    a.vx = 0; a.vy = 0; b.vx = 8; b.vy = 0;
    stepWorld(world);
    expect(b.slowedUntil).toBeGreaterThan(world.tick);
    expect(b.vx).toBeCloseTo(8 * 0.5);
    expect(b.hp).toBe(b.maxHp - 6);
    advance(world, 151);
    expect(b.slowedUntil).toBe(0);
  });

  it('Siewca launches a projectile after a wall bounce', () => {
    const world = duel('orange', 'violet');
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
    const world = duel('pink', 'violet');
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

  it('Wiązka charges, turns on, and repeatedly damages its target', () => {
    const world = duel('beam', 'jade');
    const [a, b] = world.balls;
    stepWorld(world);
    expect(a.beamChargeUntil).toBeGreaterThan(world.tick);
    a.x = -5; b.x = 5; a.y = b.y = 0;
    a.vx = a.vy = b.vx = b.vy = 0;
    let beamActivated = false;
    for (let i = 0; i < 50; i++) {
      stepWorld(world);
      beamActivated ||= world.events.some(event => event.type === 'beam' && event.color === '#48eaff');
    }
    expect(a.beamUntil).toBeGreaterThan(world.tick);
    expect(b.hp).toBeLessThan(b.maxHp);
    expect(beamActivated).toBe(true);
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

  it('Karabin fires rapid, colored projectiles which hit the opponent', () => {
    const world = duel('machine', 'jade');
    const [a, b] = world.balls;
    stepWorld(world);
    expect(world.projectiles[0]).toMatchObject({ damage: 4, color: '#ff9ee8' });
    a.x = -5; b.x = 5; a.y = b.y = 0;
    a.vx = a.vy = b.vx = b.vy = 0;
    advance(world, 30);
    expect(b.hp).toBeLessThan(b.maxHp);
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
    expect(b.vx).toBeCloseTo(3);
    a.x = -8; a.vx = a.vy = 0;
    advance(world, 90);
    expect(Math.abs(b.vx)).toBeCloseTo(6);
  });

  it('Topór contact damage grows as its health falls', () => {
    const world = duel('axe', 'jade');
    const [a, b] = world.balls;
    a.hp = 50;
    a.x = -a.radius; b.x = b.radius; a.y = b.y = 0;
    a.vx = 1; b.vx = -1; a.vy = b.vy = 0;
    stepWorld(world);
    expect(b.hp).toBe(b.maxHp - 15);
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
