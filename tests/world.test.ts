import { describe, expect, it } from 'vitest';
import { BASIC_BALLS, RULES } from '../src/shared/config';
import { createWorld, stepWorld, type World } from '../src/simulation/world';

function runToEnd(world: World) {
  while (world.phase === 'running') stepWorld(world);
  return world;
}

describe('local duel simulation', () => {
  it('uses the selected opening angle and square arena bounds', () => {
    expect(RULES.width).toBe(RULES.height);
    const world = createWorld(7, undefined, [Math.PI / 2, Math.PI]);
    const [a, b] = world.balls;
    expect(a.vx).toBeCloseTo(0);
    expect(a.vy).toBeCloseTo(BASIC_BALLS[0].speed);
    expect(b.vx).toBeCloseTo(-BASIC_BALLS[1].speed);
    a.y = RULES.height / 2 - a.radius - 0.01;
    a.vx = 0; a.vy = 8;
    b.x = 6; b.y = -6; b.vx = b.vy = 0;
    stepWorld(world);
    expect(a.vy).toBeLessThan(0);
    expect(a.y).toBeLessThanOrEqual(RULES.height / 2 - a.radius);
  });
  it('replays the same seed and finishes every normal duel', () => {
    for (const seed of [1, 2, 24, 8192]) {
      const a = runToEnd(createWorld(seed));
      const b = runToEnd(createWorld(seed));
      expect(a.tick).toBeLessThanOrEqual(RULES.maxTicks);
      expect(a).toEqual(b);
      expect(a.reason).toMatch(/knockout|timeout/);
      expect(a.hits).toBeGreaterThan(0);
      expect(a.balls.every(ball => Number.isFinite(ball.x) && Number.isFinite(ball.y))).toBe(true);
    }
  });

  it('bounces off walls without leaving the arena', () => {
    const world = createWorld(1);
    const a = world.balls[0], b = world.balls[1];
    a.x = RULES.width / 2 - a.radius - 0.01;
    a.y = 0; a.vx = 8; a.vy = 0;
    b.x = -8; b.y = 5; b.vx = 0; b.vy = 0;
    stepWorld(world);
    expect(a.vx).toBeLessThan(0);
    expect(a.x).toBeLessThanOrEqual(RULES.width / 2 - a.radius);
    expect(world.events.some(e => e.type === 'wall')).toBe(true);
  });

  it('detects a fast head-on collision within one tick', () => {
    const world = createWorld(2);
    const [a, b] = world.balls;
    a.x = -3; b.x = 3; a.y = b.y = 0;
    a.vx = 400; b.vx = -400; a.vy = b.vy = 0;
    stepWorld(world);
    expect(world.hits).toBe(1);
    expect(a.hp).toBe(90);
    expect(b.hp).toBe(90);
    expect(world.events.filter(event => event.type === 'damage').map(event => event.amount)).toEqual([10, 10]);
    expect(a.x).toBeLessThan(b.x);
    expect(a.vx).toBeLessThan(0);
    expect(b.vx).toBeGreaterThan(0);
  });

  it('keeps each ball moving at its own speed after an angled collision', () => {
    const world = createWorld(2);
    const [a, b] = world.balls;
    a.x = -1.25; a.y = -0.2; a.vx = 12; a.vy = 3;
    b.x = 1.25; b.y = 0.2; b.vx = -7; b.vy = -1;
    const speedA = Math.hypot(a.vx, a.vy), speedB = Math.hypot(b.vx, b.vy);
    stepWorld(world);
    expect(world.hits).toBe(1);
    expect(Math.hypot(a.vx, a.vy)).toBeCloseTo(speedA, 8);
    expect(Math.hypot(b.vx, b.vy)).toBeCloseTo(speedB, 8);
  });

  it('keeps teammates unharmed on contact in 2v2', () => {
    const world=createWorld(1,['jade','orange','jade','orange'],[0,Math.PI,0,Math.PI]);
    const [a,,ally]=world.balls;
    a.x=-1.2;ally.x=1.2;a.y=ally.y=0;a.vx=20;ally.vx=-20;a.vy=ally.vy=0;
    world.balls[1].x=7;world.balls[1].y=7;world.balls[1].vx=0;world.balls[1].vy=0;
    world.balls[3].x=-7;world.balls[3].y=-7;world.balls[3].vx=0;world.balls[3].vy=0;
    stepWorld(world);
    expect(a.hp).toBe(a.maxHp);expect(ally.hp).toBe(ally.maxHp);
  });

  it('charges damage only once during a continuous contact', () => {
    const world = createWorld(3);
    const [a, b] = world.balls;
    a.x = -a.radius; b.x = b.radius; a.y = b.y = 0;
    a.vx = 1; b.vx = -1; a.vy = b.vy = 0;
    stepWorld(world);
    expect(world.hits).toBe(1);
    a.vx = b.vx = 0;
    for (let i = 0; i < 20; i++) stepWorld(world);
    expect(world.hits).toBe(1);
    expect(a.hp).toBe(90);
    expect(b.hp).toBe(90);
  });

  it('re-arms damage after separation and the 0.5 s attacker cooldown', () => {
    const world = createWorld(4);
    const [a, b] = world.balls;
    a.x = -a.radius; b.x = b.radius; a.y = b.y = 0;
    a.vx = 1; b.vx = -1; a.vy = b.vy = 0;
    stepWorld(world);
    a.x = -2; b.x = 2; a.vx = 170; b.vx = -170;
    stepWorld(world);
    expect(world.hits).toBe(2);
    expect(a.hp).toBe(90);
    a.x = -7; b.x = 7; a.vx = b.vx = a.vy = b.vy = 0;
    stepWorld(world);
    for (let i = 0; i < 28; i++) stepWorld(world);
    a.x = -a.radius; b.x = b.radius; a.y = b.y = 0; a.vx = 1; b.vx = -1;
    stepWorld(world);
    expect(a.hp).toBe(80);
  });

  it('ends immediately on a double knockout and freezes the result', () => {
    const world = createWorld(5);
    const [a, b] = world.balls;
    a.x = -a.radius - 0.1; b.x = b.radius + 0.1; a.y = b.y = 0;
    a.vx = 6; b.vx = -6; a.vy = b.vy = 0;
    a.hp = b.hp = 10;
    stepWorld(world);
    expect(world.phase).toBe('finished');
    expect(world.winner).toBeNull();
    expect(world.reason).toBe('knockout');
    const tick = world.tick;
    stepWorld(world);
    expect(world.tick).toBe(tick);
  });

  it('awards the higher remaining health at the time limit', () => {
    const world = createWorld(6);
    const [a, b] = world.balls;
    a.x = -6; b.x = 6; a.y = b.y = 0;
    a.vx = b.vx = a.vy = b.vy = 0;
    b.hp = 80;
    world.tick = RULES.maxTicks - 1;
    stepWorld(world);
    expect(world.phase).toBe('finished');
    expect(world.winner).toBe(a.id);
    expect(world.reason).toBe('timeout');
  });
});
