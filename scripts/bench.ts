import { performance } from 'node:perf_hooks';
import { createWorld, stepWorld } from '../src/simulation/world';

const rounds = 48;
let ticks = 0;
let hits = 0;
const start = performance.now();
for (let seed = 1; seed <= rounds; seed++) {
  const world = createWorld(seed, ['amber', 'jade', 'steel', 'violet']);
  while (world.phase === 'running' && world.tick < 3600) {
    stepWorld(world);
    ticks++;
  }
  hits += world.hits;
}
const elapsed = performance.now() - start;
console.log(`${rounds} walk 2v2 · ${ticks} ticków · ${hits} zderzeń`);
console.log(`${elapsed.toFixed(1)} ms razem · ${(elapsed / ticks).toFixed(4)} ms/tick · ${Math.round(ticks / (elapsed / 1000))} ticków/s`);
