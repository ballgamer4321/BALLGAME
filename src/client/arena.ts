import * as THREE from 'three';
import { BASIC_BALLS, MATCH_BALLS, RULES } from '../shared/config';
import { COSMETICS } from '../shared/progression';
import type { World } from '../simulation/world';

interface EnergyStrip { group: THREE.Group; core: THREE.Mesh; glow: THREE.Mesh; marker: THREE.Mesh; }
interface ProjectileVisual { orb: THREE.Mesh; shard: THREE.Mesh; streak: THREE.Mesh; hook: THREE.Group; bullet: THREE.Group; cannonball: THREE.Group; knife: THREE.Group; rocket: THREE.Group; arrow: THREE.Group; }
interface PowerSpark { mesh: THREE.Mesh; life: number; maxLife: number; vx: number; vz: number; spin: number; }
interface DiceVisual { group: THREE.Group; pips: THREE.Mesh[]; }
interface TimedGroup { group: THREE.Group; life: number; maxLife: number; }

const AXE_VISUAL_SCALE = 1.28;

function makeEnergyStrip(): EnergyStrip {
  const group = new THREE.Group();
  const core = new THREE.Mesh(new THREE.BoxGeometry(1, 0.055, 0.11),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.96 }));
  const glow = new THREE.Mesh(new THREE.BoxGeometry(1, 0.2, 0.42),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.32, depthWrite: false }));
  const marker = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.11, 0.18),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false }));
  marker.position.y = 0.045;
  group.add(glow, core, marker);
  return { group, core, glow, marker };
}

function addCylinderBetween(group: THREE.Group, start: THREE.Vector3, end: THREE.Vector3,
  radiusStart: number, radiusEnd: number, material: THREE.Material, segments = 10) {
  const direction = end.clone().sub(start);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusEnd, radiusStart, direction.length(), segments), material);
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  mesh.castShadow = true;
  group.add(mesh);
  return mesh;
}

function makeExtrudedPolygonGeometry(points: readonly [number, number][], depth: number) {
  const geometry = new THREE.BufferGeometry();
  const center: [number, number] = [
    points.reduce((sum, point) => sum + point[0], 0) / points.length,
    points.reduce((sum, point) => sum + point[1], 0) / points.length,
  ];
  const area = points.reduce((sum, point, index) => {
    const next = points[(index + 1) % points.length];
    return sum + point[0] * next[1] - next[0] * point[1];
  }, 0);
  const positions: number[] = [];
  const triangle = (a: [number, number, number], b: [number, number, number], c: [number, number, number]) => positions.push(...a, ...b, ...c);
  const front = depth / 2, back = -depth / 2;
  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length];
    const a: [number, number, number] = [point[0], point[1], front];
    const b: [number, number, number] = [next[0], next[1], front];
    const aBack: [number, number, number] = [point[0], point[1], back];
    const bBack: [number, number, number] = [next[0], next[1], back];
    const centerFront: [number, number, number] = [center[0], center[1], front];
    const centerBack: [number, number, number] = [center[0], center[1], back];
    if (area < 0) {
      triangle(centerFront, a, b);
      triangle(centerBack, bBack, aBack);
    } else {
      triangle(centerFront, b, a);
      triangle(centerBack, aBack, bBack);
    }
    triangle(a, aBack, bBack);
    triangle(a, bBack, b);
  });
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function makeAxeHeadGeometry() {
  const points: [number, number][] = [[-0.08, -0.19], [-0.34, -0.27], [-0.57, -0.43]];
  const curve = (start: [number, number], control: [number, number], end: [number, number]) => {
    for (let step = 1; step <= 8; step++) {
      const t = step / 8, inverse = 1 - t;
      points.push([
        inverse * inverse * start[0] + 2 * inverse * t * control[0] + t * t * end[0],
        inverse * inverse * start[1] + 2 * inverse * t * control[1] + t * t * end[1],
      ]);
    }
  };
  curve([-0.57, -0.43], [-0.96, -0.55], [-1.14, -0.25]);
  curve([-1.14, -0.25], [-1.34, 0], [-1.14, 0.25]);
  curve([-1.14, 0.25], [-0.96, 0.55], [-0.57, 0.43]);
  points.push([-0.34, 0.27], [-0.08, 0.19]);
  return makeExtrudedPolygonGeometry(points, 0.14);
}

function makeBallSignature(id: string, color: string) {
  const group = new THREE.Group();
  const accent = new THREE.MeshStandardMaterial({ color, metalness: 0.72, roughness: 0.24, emissive: color, emissiveIntensity: 0.08 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x253039, metalness: 0.82, roughness: 0.3 });
  const steel = new THREE.MeshStandardMaterial({ color: 0xcbd6df, metalness: 0.92, roughness: 0.2 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x684626, metalness: 0.12, roughness: 0.72 });
  const brass = new THREE.MeshStandardMaterial({ color: 0xd4aa57, metalness: 0.86, roughness: 0.24 });
  const cloth = new THREE.MeshStandardMaterial({ color: 0x341d32, metalness: 0.08, roughness: 0.84, side: THREE.DoubleSide });
  const add = (geometry: THREE.BufferGeometry, material: THREE.Material, position: [number, number, number], rotation: [number, number, number] = [0, 0, 0]) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position); mesh.rotation.set(...rotation); mesh.castShadow = true; group.add(mesh);
    return mesh;
  };
  const forward = (geometry: THREE.BufferGeometry, material: THREE.Material, position: [number, number, number], rotation: [number, number, number] = [Math.PI / 2, 0, 0]) => add(geometry, material, position, rotation);

  if (id === 'amber') {
    for (const side of [-1, 1]) {
      add(new THREE.BoxGeometry(0.16, 0.2, 0.56), accent, [side * 0.48, 0.16, 0.92], [0, side * 0.24, side * -0.12]);
      forward(new THREE.CylinderGeometry(0.11, 0.17, 0.38, 8), dark, [side * 0.48, 0.16, 1.28]);
      add(new THREE.TorusGeometry(0.13, 0.035, 7, 14), brass, [side * 0.48, 0.16, 1.45]);
      add(new THREE.BoxGeometry(0.1, 0.12, 0.2), steel, [side * 0.48, 0.31, 0.9]);
    }
  }
  if (id === 'jade') {
    for (const side of [-1, 1]) {
      forward(new THREE.ConeGeometry(0.17, 0.76, 8), steel, [side * 0.36, 0.12, 1.28], [Math.PI / 2, 0, side * -0.28]);
      add(new THREE.SphereGeometry(0.075, 12, 10), accent, [side * 0.24, 0.36, 1.36]);
    }
    add(new THREE.BoxGeometry(0.42, 0.36, 0.46), dark, [0, 0.1, 0.78], [0.14, 0, 0]);
    forward(new THREE.CylinderGeometry(0.13, 0.19, 0.5, 9), accent, [0, 0.12, 1.02]);
    add(new THREE.SphereGeometry(0.12, 12, 10), brass, [0, 0.12, 1.27]);
  }
  if (id === 'violet') {
    const prism = add(new THREE.OctahedronGeometry(0.31, 0), accent, [0, 0.48, 1.18], [0.25, 0.2, 0]);
    prism.name = 'prism-core';
    for (const y of [0.16, 0.78]) {
      add(new THREE.BoxGeometry(0.66, 0.11, 0.12), steel, [0, y, 0.94]);
      for (const side of [-1, 1]) add(new THREE.BoxGeometry(0.11, 0.52, 0.12), brass, [side * 0.3, (y + 0.47) / 2, 0.94]);
    }
    add(new THREE.OctahedronGeometry(0.12), steel, [0, 0.48, 1.52], [0, 0, Math.PI / 4]);
  }
  if (id === 'steel') {
    const shieldPoints: [number, number][] = [[-0.36, 0.42], [0.36, 0.42], [0.32, -0.1], [0.22, -0.42], [0, -0.58], [-0.22, -0.42], [-0.32, -0.1]];
    const plate = new THREE.Mesh(makeExtrudedPolygonGeometry(shieldPoints, 0.1), accent);
    plate.position.set(-1.16, 0.14, 0.52); plate.rotation.x = Math.PI / 2; plate.castShadow = true; group.add(plate);
    const crest = add(new THREE.OctahedronGeometry(0.18, 0), brass, [-1.16, 0.18, 0.62], [0, 0, Math.PI / 4]);
    crest.scale.set(0.72, 0.72, 0.35);
    for (const side of [-1, 1]) {
      add(new THREE.SphereGeometry(0.065, 10, 8), steel, [-1.16 + side * 0.24, 0.2, 0.48]);
      add(new THREE.BoxGeometry(0.075, 0.075, 0.46), brass, [-1.16 + side * 0.28, 0.18, 0.52]);
    }
    add(new THREE.BoxGeometry(0.13, 0.1, 0.62), dark, [-1.16, -0.02, 0.54]);
  }
  if (id === 'gold') {
    const orbit = new THREE.Group(); orbit.name = 'gold-orbit'; group.add(orbit);
    for (let shard = 0; shard < 3; shard++) {
      const angle = shard / 3 * Math.PI * 2;
      const gem = new THREE.Mesh(new THREE.TetrahedronGeometry(0.2), accent);
      gem.position.set(Math.cos(angle) * 1.5, 0.32 + (shard % 2) * 0.2, Math.sin(angle) * 1.5);
      gem.rotation.set(angle, angle * 0.6, 0); gem.castShadow = true; orbit.add(gem);
      const mount = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.2), brass);
      mount.position.copy(gem.position).multiplyScalar(0.88); mount.castShadow = true; orbit.add(mount);
    }
  }
  if (id === 'cyan') {
    add(new THREE.BoxGeometry(0.64, 0.22, 0.46), dark, [0, 0.1, 0.68]);
    forward(new THREE.CylinderGeometry(0.23, 0.3, 0.62, 9), steel, [0, 0.12, 1.04]);
    add(new THREE.TorusGeometry(0.22, 0.055, 8, 18), accent, [0, 0.12, 1.38]);
    for (const [index, x] of [-0.42, 0, 0.42].entries()) {
      const shard = add(new THREE.OctahedronGeometry(index === 1 ? 0.3 : 0.22), accent,
        [x, 0.2 + (index === 1 ? 0.11 : 0), 1.22 - Math.abs(x) * 0.12], [0.25, 0, index * 0.42]);
      shard.scale.set(0.72, 0.82, 1.7);
      shard.name = 'ice-shard';
    }
  }
  if (id === 'orange') {
    add(new THREE.BoxGeometry(0.48, 0.2, 0.46), dark, [0, 0.11, 0.82]);
    forward(new THREE.CylinderGeometry(0.17, 0.22, 0.68, 10), accent, [0, 0.12, 1.2]);
    forward(new THREE.CylinderGeometry(0.12, 0.15, 0.08, 10), dark, [0, 0.12, 1.57]);
    for (const side of [-1, 1]) {
      const fin = add(new THREE.ConeGeometry(0.2, 0.62, 5), brass, [side * 0.38, 0.12, 0.74], [0, 0, side * -Math.PI / 2]);
      fin.scale.set(0.55, 1, 1.3);
      add(new THREE.SphereGeometry(0.12, 10, 8), accent, [side * 0.22, 0.12, 1.52]);
    }
  }
  if (id === 'pink') {
    const orbit = new THREE.Group(); orbit.name = 'echo-orbit'; group.add(orbit);
    for (const side of [-1, 1]) {
      const echo = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), accent);
      echo.position.set(side * 1.32, 0.2, 0.58); echo.castShadow = true; orbit.add(echo);
      const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.12), steel);
      core.position.copy(echo.position); orbit.add(core);
      for (const y of [-0.16, 0.16]) {
        const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.055, 0.075), brass);
        bracket.position.set(side * 1.32, 0.2 + y, 0.58); bracket.castShadow = true; orbit.add(bracket);
      }
    }
  }
  if (id === 'beam') {
    add(new THREE.BoxGeometry(0.48, 0.3, 0.64), dark, [0, 0.1, 0.78]);
    forward(new THREE.CylinderGeometry(0.22, 0.3, 0.58, 10), accent, [0, 0.12, 1.14]);
    add(new THREE.TorusGeometry(0.21, 0.045, 8, 18), steel, [0, 0.12, 1.46]);
    add(new THREE.SphereGeometry(0.12, 12, 10), steel, [0, 0.12, 1.45]);
    for (const side of [-1, 1]) {
      add(new THREE.BoxGeometry(0.14, 0.12, 0.52), brass, [side * 0.29, 0.08, 0.86], [0, side * 0.12, 0]);
      add(new THREE.SphereGeometry(0.1, 10, 8), accent, [side * 0.32, 0.11, 0.7]);
    }
  }
  if (id === 'laser') {
    add(new THREE.BoxGeometry(0.72, 0.14, 0.46), dark, [0, 0.15, 0.78]);
    for (const side of [-1, 1]) {
      add(new THREE.BoxGeometry(0.3, 0.22, 0.42), accent, [side * 0.3, 0.19, 1.03], [0, 0, side * -0.12]);
      forward(new THREE.CylinderGeometry(0.09, 0.15, 0.58, 10), dark, [side * 0.3, 0.19, 1.29]);
      add(new THREE.TorusGeometry(0.12, 0.035, 8, 16), steel, [side * 0.3, 0.19, 1.59]);
      add(new THREE.SphereGeometry(0.085, 12, 10), accent, [side * 0.3, 0.19, 1.6]);
      add(new THREE.BoxGeometry(0.07, 0.08, 0.25), brass, [side * 0.3, 0.33, 1.05]);
    }
  }
  if (id === 'machine' || id === 'machine-gun') {
    add(new THREE.BoxGeometry(0.68, 0.34, 0.54), dark, [0, 0.1, 0.82]);
    for (const side of [-1, 1]) {
      const drum = add(new THREE.CylinderGeometry(0.17, 0.17, 0.22, 12), brass, [side * 0.42, 0.1, 0.7], [0, 0, Math.PI / 2]);
      drum.name = 'ammo-drum';
      add(new THREE.BoxGeometry(0.13, 0.1, 0.36), steel, [side * 0.34, 0.31, 0.84], [0, 0, side * 0.14]);
    }
    for (const [index, x] of [-0.23, 0.23].entries()) {
      const barrel = new THREE.Group();
      barrel.position.set(x, 0.08, 1.06); barrel.rotation.x = Math.PI / 2; group.add(barrel);
      const rotor = new THREE.Group(); barrel.add(rotor);
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.64, 8), dark);
      body.castShadow = true; rotor.add(body);
      for (let fin = 0; fin < 4; fin++) {
        const angle = fin * Math.PI / 2;
        const vane = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.5, 0.035), accent);
        vane.position.set(Math.cos(angle) * 0.105, 0, Math.sin(angle) * 0.105);
        vane.castShadow = true; rotor.add(vane);
      }
      const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 8), accent);
      muzzle.position.y = 0.34; muzzle.castShadow = true; barrel.add(muzzle);
      rotor.userData.phase = index * 0.7;
      const rotors = group.userData.rotors as THREE.Group[] | undefined;
      if (rotors) rotors.push(rotor);
      else group.userData.rotors = [rotor];
    }
  }
  if (id === 'cannon') {
    add(new THREE.BoxGeometry(0.72, 0.28, 0.52), dark, [0, 0.08, 0.78]);
    for (const [index, x] of [-0.2, 0, 0.2].entries()) {
      forward(new THREE.CylinderGeometry(0.13, 0.19, 0.76, 10), dark, [x, 0.15 + (index === 1 ? 0.04 : 0), 1.12]);
      add(new THREE.TorusGeometry(0.15, 0.045, 8, 16), accent, [x, 0.15 + (index === 1 ? 0.04 : 0), 1.5]);
      forward(new THREE.CylinderGeometry(0.085, 0.085, 0.065, 10), steel, [x, 0.15 + (index === 1 ? 0.04 : 0), 1.51]);
    }
    add(new THREE.BoxGeometry(0.36, 0.14, 0.28), steel, [0, -0.12, 0.78]);
    for (const side of [-1, 1]) add(new THREE.BoxGeometry(0.1, 0.08, 0.32), brass, [side * 0.38, 0.08, 0.94]);
  }
  if (id === 'spider') {
    const abdomen = add(new THREE.SphereGeometry(0.34, 16, 12), accent, [0, 0.12, 1.1]);
    abdomen.scale.set(1.08, 0.88, 1.12);
    add(new THREE.SphereGeometry(0.21, 14, 10), dark, [0, 0.12, 1.48]);
    add(new THREE.BoxGeometry(0.12, 0.06, 0.42), brass, [0, 0.17, 1.1], [0.12, 0, 0]);
    for (const side of [-1, 1]) add(new THREE.SphereGeometry(0.055, 8, 8), steel, [side * 0.1, 0.23, 1.65]);
    for (const side of [-1, 1]) forward(new THREE.ConeGeometry(0.08, 0.24, 6), steel,
      [side * 0.12, 0.1, 1.68], [Math.PI / 2, 0, Math.PI + side * 0.24]);
    for (let legIndex = 0; legIndex < 8; legIndex++) {
      const angle = legIndex / 8 * Math.PI * 2;
      const sx = Math.cos(angle), sz = Math.sin(angle);
      const leg = add(new THREE.ConeGeometry(0.075, 0.64, 6), dark,
        [sx * 1.18, 0.08, sz * 1.18], [sz * 0.56, 0, -sx * 0.66]);
      add(new THREE.SphereGeometry(0.09, 8, 7), brass, [sx * 0.83, 0.1, sz * 0.83]);
      leg.name = 'spider-leg';
      leg.userData.phase = legIndex * Math.PI / 4;
      leg.userData.restRotation = { x: leg.rotation.x, y: leg.rotation.y, z: leg.rotation.z };
    }
  }
  if (id === 'blade') {
    const orbit = new THREE.Group(); orbit.name = 'blade-orbit'; group.add(orbit);
    const blades: THREE.Group[] = [];
    for (let index = 0; index < 5; index++) {
      const sword = new THREE.Group();
      sword.position.set(0, 0.14, 2.7);
      sword.rotation.y = index / 5 * Math.PI * 2;
      const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.08, 0.56, 8), wood);
      grip.rotation.x = Math.PI / 2; grip.position.z = 0.28; grip.castShadow = true; sword.add(grip);
      const guard = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.12), dark);
      guard.position.z = 0.56; sword.add(guard);
      const edge = new THREE.Mesh(makeExtrudedPolygonGeometry([
        [-0.17, 0], [-0.15, 0.52], [-0.1, 0.75], [0, 0.98], [0.1, 0.75], [0.15, 0.52], [0.17, 0],
      ], 0.075), steel);
      edge.rotation.x = Math.PI / 2; edge.position.z = 0.56; edge.castShadow = true; sword.add(edge);
      const inlay = new THREE.Mesh(makeExtrudedPolygonGeometry([
        [-0.035, 0.08], [-0.025, 0.54], [0, 0.82], [0.025, 0.54], [0.035, 0.08],
      ], 0.012), accent);
      inlay.rotation.x = Math.PI / 2; inlay.position.set(0, -0.012, 0.56); sword.add(inlay);
      orbit.add(sword); blades.push(sword);
    }
    orbit.userData.blades = blades;
  }
  if (id === 'burst') {
    add(new THREE.BoxGeometry(0.74, 0.3, 0.68), dark, [0, 0.12, 0.66]);
    for (const side of [-1, 1]) {
      add(new THREE.BoxGeometry(0.3, 0.32, 0.38), steel, [side * 0.39, 0.12, 0.72], [0, 0, side * 0.12]);
      forward(new THREE.CylinderGeometry(0.12, 0.2, 0.42, 8), dark, [side * 0.39, 0.12, 0.98]);
      add(new THREE.TorusGeometry(0.13, 0.035, 7, 14), brass, [side * 0.39, 0.12, 1.19]);
      forward(new THREE.ConeGeometry(0.11, 0.3, 6), accent, [side * 0.39, 0.12, 1.3]);
      add(new THREE.ConeGeometry(0.17, 0.6, 5), steel, [side * 0.5, 0.3, 0.8], [0, 0, side * -0.32]);
    }
  }
  if (id === 'charge') {
    add(new THREE.BoxGeometry(0.72, 0.56, 0.55), dark, [0, 0.13, 0.7]);
    add(new THREE.BoxGeometry(0.48, 0.42, 0.12), accent, [0, 0.16, 0.99]);
    add(new THREE.BoxGeometry(0.12, 0.08, 0.36), brass, [0, 0.18, 1.08]);
    for (const side of [-1, 1]) {
      add(new THREE.CylinderGeometry(0.075, 0.1, 0.44, 8), steel, [side * 0.31, 0.36, 0.8]);
      add(new THREE.BoxGeometry(0.14, 0.12, 0.36), brass, [side * 0.31, 0.58, 0.8]);
    }
  }
  if (id === 'glass') {
    const core = add(new THREE.OctahedronGeometry(0.34, 0), steel, [0, 0.2, 0.86], [0.18, 0.12, Math.PI / 4]);
    core.scale.set(0.85, 1.15, 1.1);
    add(new THREE.OctahedronGeometry(0.19), accent, [0, 0.22, 1.12], [0.25, 0, 0.35]);
    for (let index = 0; index < 6; index++) {
      const angle = index / 6 * Math.PI * 2;
      const shard = add(new THREE.TetrahedronGeometry(0.29), accent,
        [Math.cos(angle) * 1.08, 0.2 + (index % 2) * 0.12, Math.sin(angle) * 1.08], [0.25, angle, 0.42]);
      shard.scale.set(0.7, 1.6, 0.65);
      const clamp = add(new THREE.BoxGeometry(0.18, 0.07, 0.22), steel,
        [Math.cos(angle) * 0.89, 0.15, Math.sin(angle) * 0.89], [0, -angle, 0]);
      clamp.name = 'glass-clamp';
    }
  }
  if (id === 'poison-spike') {
    add(new THREE.SphereGeometry(0.25, 14, 10), accent, [0, 0.12, 0.58]);
    forward(new THREE.CylinderGeometry(0.18, 0.26, 0.42, 9), dark, [0, 0.12, 0.82]);
    add(new THREE.TorusGeometry(0.19, 0.04, 7, 16), brass, [0, 0.12, 1.03]);
    for (let index = 0; index < 8; index++) {
      const angle = index / 8 * Math.PI * 2;
      const x = Math.cos(angle) * 1.12, z = Math.sin(angle) * 1.12;
      add(new THREE.SphereGeometry(0.14, 9, 7), steel, [x * 0.84, 0.12, z * 0.84]);
      const spike = add(new THREE.ConeGeometry(0.15, 0.78, 7), accent,
        [x, 0.12, z], [Math.sin(angle) * 0.7, 0, -Math.cos(angle) * 0.7]);
      spike.name = 'poison-spike';
      add(new THREE.OctahedronGeometry(0.075), brass, [x * 1.38, 0.12, z * 1.38]);
    }
    add(new THREE.SphereGeometry(0.09, 10, 8), brass, [0, 0.24, 0.52]);
  }
  if (id === 'thief') {
    for (const side of [-1, 1]) {
      const knife = new THREE.Group(); knife.position.set(side * 0.62, 0.14, 1.05); knife.rotation.y = side * -0.22; group.add(knife);
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.4, 8), wood);
      handle.rotation.x = Math.PI / 2; handle.position.z = 0.2; knife.add(handle);
      const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), brass);
      pommel.position.z = 0.02; knife.add(pommel);
      const guard = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 0.1), brass);
      guard.position.z = 0.42; knife.add(guard);
      const blade = new THREE.Mesh(makeExtrudedPolygonGeometry([
        [-0.13, 0], [-0.12, 0.34], [-0.08, 0.58], [0, 0.76], [0.08, 0.58], [0.12, 0.34], [0.13, 0],
      ], 0.065), steel);
      blade.rotation.x = Math.PI / 2; blade.position.z = 0.42; blade.castShadow = true; knife.add(blade);
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.02, 0.5), accent);
      stripe.position.set(0, 0, 0.71); knife.add(stripe);
    }
  }
  if (id === 'vampire') {
    const wingPoints: [number, number][] = [[0, 0], [0.24, 0.14], [0.82, 0.62], [0.7, 0.28], [1.08, 0.35], [0.9, 0.02], [0.72, -0.22], [0.54, -0.08], [0.38, -0.3], [0.2, -0.13]];
    for (const side of [-1, 1]) {
      const wing = new THREE.Mesh(makeExtrudedPolygonGeometry(wingPoints.map(([x, z]) => [x * side, z] as [number, number]), 0.085), cloth);
      wing.position.set(0, 0.13, 0.02); wing.rotation.x = Math.PI / 2; wing.castShadow = true; wing.name = 'vampire-wing'; group.add(wing);
      wing.userData.side = side;
      add(new THREE.SphereGeometry(0.075, 10, 8), brass, [side * 0.2, 0.18, 0.12]);
    }
    add(new THREE.BoxGeometry(0.34, 0.18, 0.2), dark, [0, 0.14, 0.2]);
    add(new THREE.OctahedronGeometry(0.2), accent, [0, 0.21, 0.42], [0.1, 0.2, Math.PI / 4]);
    for (const side of [-1, 1]) forward(new THREE.ConeGeometry(0.16, 0.56, 7), steel,
      [side * 0.25, 0.12, 1.04], [Math.PI / 2, 0, Math.PI + side * 0.12]);
    add(new THREE.SphereGeometry(0.15, 12, 10), accent, [0, 0.12, 1.2]);
  }
  if (id === 'cell') {
    const membrane = new THREE.Mesh(new THREE.SphereGeometry(0.54, 20, 14),
      new THREE.MeshPhysicalMaterial({ color, metalness: 0.18, roughness: 0.3, transparent: true, opacity: 0.38, side: THREE.DoubleSide }));
    membrane.position.set(0, 0.16, 0.82); membrane.scale.set(1.02, 0.72, 0.78); membrane.castShadow = true; group.add(membrane);
    const nucleus = add(new THREE.SphereGeometry(0.2, 16, 12), steel, [0.02, 0.17, 0.9]);
    nucleus.scale.set(0.9, 0.82, 0.86);
    const nucleolus = add(new THREE.SphereGeometry(0.075, 10, 8), accent, [0.03, 0.18, 1.06]);
    nucleolus.name = 'cell-nucleolus';
    for (const [index, [x, z]] of [[0, [-0.3, 0.69]], [1, [0.32, 0.75]], [2, [-0.18, 1.08]], [3, [0.3, 0.48]]] as const) {
      const organelle = add(new THREE.SphereGeometry(0.12, 12, 8), index % 2 ? brass : accent, [x, 0.15, z]);
      organelle.scale.set(1.5, 0.66, 0.72); organelle.rotation.y = index * 0.72;
      organelle.name = 'cell-organelle';
    }
    for (let index = 0; index < 7; index++) {
      const angle = index / 7 * Math.PI * 2;
      const start = new THREE.Vector3(Math.cos(angle) * 0.44, 0.14, 0.82 + Math.sin(angle) * 0.42);
      const end = new THREE.Vector3(Math.cos(angle) * 0.68, 0.14, 0.82 + Math.sin(angle) * 0.64);
      const cilium = addCylinderBetween(group, start, end, 0.045, 0.025, steel, 7);
      cilium.name = 'cell-cilium'; cilium.userData.phase = angle; cilium.userData.restQuaternion = cilium.quaternion.clone();
    }
  }
  if (id === 'chess') {
    add(new THREE.CylinderGeometry(0.43, 0.52, 0.16, 8), dark, [0, 0.12, 0.7]);
    add(new THREE.CylinderGeometry(0.32, 0.4, 0.72, 8), accent, [0, 0.12, 0.96]);
    add(new THREE.CylinderGeometry(0.48, 0.48, 0.12, 8), steel, [0, 0.12, 1.36]);
    for (const x of [-0.23, 0.23]) for (const z of [1.58, 1.93])
      add(new THREE.BoxGeometry(0.16, 0.13, 0.16), accent, [x, 0.12, z]);
    add(new THREE.BoxGeometry(0.12, 0.12, 0.54), steel, [0, 0.12, 1.68]);
    add(new THREE.BoxGeometry(0.44, 0.12, 0.12), steel, [0, 0.12, 1.84]);
    add(new THREE.TorusGeometry(0.34, 0.035, 7, 8), brass, [0, 0.12, 1.03], [Math.PI / 2, 0, 0]);
  }
  if (id === 'dice') {
    const die = add(new THREE.BoxGeometry(0.82, 0.82, 0.82), steel, [0, 0.18, 1.02], [0.18, 0.28, 0.12]);
    die.name = 'dice-core';
    for (const [x, y] of [[-0.16, -0.16], [0.16, 0.16], [0.16, -0.16], [-0.16, 0.16], [0, 0], [-0.16, 0], [0.16, 0]] as const) {
      const pip = add(new THREE.SphereGeometry(0.06, 10, 8), dark, [x, 0.19 + y, 1.44]); pip.name = 'dice-pip';
    }
    for (const [x, z] of [[-0.16, -0.16], [0.16, 0.16], [0.16, -0.16], [-0.16, 0.16], [0, 0]] as const) {
      const pip = add(new THREE.SphereGeometry(0.06, 10, 8), dark, [x, 0.61, 1.02 + z]); pip.name = 'dice-pip';
    }
    for (const [y, z] of [[-0.16, -0.16], [0.16, 0.16], [0, 0]] as const) {
      const pip = add(new THREE.SphereGeometry(0.06, 10, 8), dark, [0.42, 0.18 + y, 1.02 + z]); pip.name = 'dice-pip';
    }
  }
  if (id === 'electric') {
    add(new THREE.BoxGeometry(0.64, 0.28, 0.48), dark, [0, 0.1, 0.74]);
    const bolt = add(makeExtrudedPolygonGeometry([
      [-0.08, 0.5], [0.31, 0.5], [0.08, 0.12], [0.34, 0.12], [-0.22, -0.55], [-0.08, -0.06], [-0.32, -0.06],
    ], 0.14), accent, [0, 0.15, 1.42], [Math.PI / 2, 0, 0]);
    bolt.name = 'electric-bolt';
    for (const side of [-1, 1]) {
      forward(new THREE.CylinderGeometry(0.11, 0.13, 0.42, 9), steel, [side * 0.43, 0.13, 0.82]);
      add(new THREE.TorusGeometry(0.13, 0.035, 7, 14), brass, [side * 0.43, 0.13, 1.02]);
      add(new THREE.SphereGeometry(0.11, 10, 8), accent, [side * 0.43, 0.13, 0.62]);
    }
  }
  if (id === 'hook') {
    addCylinderBetween(group, new THREE.Vector3(-0.08, 0.14, 0.84), new THREE.Vector3(0.18, 0.14, 1.5), 0.12, 0.14, wood, 10);
    add(new THREE.TorusGeometry(0.14, 0.035, 7, 12), brass, [0.12, 0.14, 1.34], [Math.PI / 2, 0, 0]);
    add(new THREE.TorusGeometry(0.12, 0.035, 7, 12), steel, [-0.02, 0.14, 0.99], [Math.PI / 2, 0, 0]);
    const hookCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.18, 0.14, 1.5), new THREE.Vector3(0.42, 0.14, 1.75),
      new THREE.Vector3(0.75, 0.14, 1.68), new THREE.Vector3(0.83, 0.14, 1.34),
      new THREE.Vector3(0.58, 0.14, 1.18), new THREE.Vector3(0.43, 0.14, 1.36),
    ]);
    const hook = add(new THREE.TubeGeometry(hookCurve, 24, 0.13, 10, false), steel, [0, 0, 0]);
    hook.name = 'hook-head';
  }
  if (id === 'ice-cone') {
    add(new THREE.CylinderGeometry(0.18, 0.44, 0.58, 8), dark, [0, 0.12, 0.88], [Math.PI / 2, 0, 0]);
    add(new THREE.BoxGeometry(0.56, 0.16, 0.28), brass, [0, 0.13, 0.74]);
    const cone = forward(new THREE.ConeGeometry(0.38, 0.92, 7), accent, [0, 0.12, 1.4]);
    cone.name = 'ice-cone-head';
    for (const side of [-1, 1]) {
      const shard = add(new THREE.OctahedronGeometry(0.23), steel, [side * 0.48, 0.16, 0.74], [0.2, side * 0.2, 0.5]);
      shard.scale.set(0.65, 0.8, 1.5);
      add(new THREE.BoxGeometry(0.1, 0.13, 0.42), dark, [side * 0.3, 0.11, 0.96], [0, 0, side * 0.2]);
    }
  }
  if (id === 'reforge') {
    const companion = new THREE.Group(); companion.name = 'reforge-companion'; group.add(companion);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.34, 18, 14), accent); orb.castShadow = true; companion.add(orb);
    const lens = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), steel);
    lens.position.set(0, 0.04, 0.3); lens.scale.set(0.8, 0.8, 0.55); companion.add(lens);
    for (const side of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.1, 0.34), dark);
      wing.position.set(side * 0.35, 0.05, -0.02); wing.rotation.y = side * 0.28; wing.castShadow = true; companion.add(wing);
      const engine = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.24, 9), brass);
      engine.position.set(side * 0.34, -0.03, -0.16); engine.rotation.z = Math.PI / 2; companion.add(engine);
      const fin = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.26, 5), steel);
      fin.position.set(side * 0.43, 0.04, 0.12); fin.rotation.z = side * Math.PI / 2; companion.add(fin);
    }
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.36, 6), steel);
    tail.rotation.x = -Math.PI / 2; tail.position.z = -0.28; companion.add(tail);
  }
  if (id === 'snake') {
    const head = new THREE.Group(); head.name = 'snake-head'; group.add(head);
    const headPart = (geometry: THREE.BufferGeometry, material: THREE.Material, position: [number, number, number], rotation: [number, number, number] = [0, 0, 0]) => {
      const mesh = new THREE.Mesh(geometry, material); mesh.position.set(...position); mesh.rotation.set(...rotation); mesh.castShadow = true; head.add(mesh); return mesh;
    };
    const hood = headPart(new THREE.SphereGeometry(0.42, 18, 12), accent, [0, 0.22, 1.03]);
    hood.scale.set(1.06, 0.78, 0.94);
    headPart(new THREE.BoxGeometry(0.32, 0.16, 0.38), dark, [0, 0.18, 1.27]);
    for (const side of [-1, 1]) {
      headPart(new THREE.SphereGeometry(0.085, 10, 8), steel, [side * 0.2, 0.34, 1.38]);
      headPart(new THREE.SphereGeometry(0.035, 8, 6), dark, [side * 0.2, 0.34, 1.425]);
      headPart(new THREE.ConeGeometry(0.075, 0.24, 6), steel, [side * 0.13, 0.08, 1.48], [Math.PI / 2, 0, Math.PI + side * 0.16]);
    }
    const crest = headPart(new THREE.ConeGeometry(0.16, 0.42, 5), brass, [0, 0.5, 1.03]);
    crest.rotation.z = Math.PI;
    for (let index = 0; index < 10; index++) {
      const segment = new THREE.Group(); segment.name = 'snake-segment'; segment.userData.index = index;
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.31 - index * 0.01, 14, 10), index % 2 ? dark : accent);
      body.scale.set(1, 0.73, 1.16); body.position.y = 0.25; body.castShadow = true; segment.add(body);
      const scale = new THREE.Mesh(new THREE.OctahedronGeometry(0.13, 0), brass);
      scale.position.set(0, 0.43, -0.02); scale.scale.set(0.72, 0.52, 1.1); segment.add(scale);
      segment.position.set(0, 0.22, -(index + 1) * 0.78); group.add(segment);
    }
  }
  if (id === 'zone') {
    const hub = add(new THREE.CylinderGeometry(0.3, 0.42, 0.3, 8), dark, [0, 0.16, 0.78]);
    hub.rotation.x = Math.PI / 2;
    const core = add(new THREE.OctahedronGeometry(0.3, 0), accent, [0, 0.2, 1.02], [0.2, 0, Math.PI / 4]);
    core.name = 'zone-core';
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.07, 8, 40), brass);
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.08; ring.name = 'zone-ring'; group.add(ring);
    const emitter = add(new THREE.ConeGeometry(0.16, 0.48, 5), steel, [0, 0.16, 1.38]);
    emitter.name = 'zone-emitter';
  }
  if (id === 'apple') {
    const basket = add(new THREE.BoxGeometry(0.56, 0.18, 0.44), dark, [0, 0.1, 0.76]);
    basket.rotation.x = Math.PI / 2;
    const fruit = add(new THREE.SphereGeometry(0.35, 16, 12), accent, [0, 0.18, 1.05]);
    fruit.scale.set(0.92, 0.83, 1.05);
    add(new THREE.SphereGeometry(0.22, 14, 10), accent, [0, 0.19, 1.25]);
    const stem = add(new THREE.CylinderGeometry(0.045, 0.055, 0.3, 7), wood, [0, 0.43, 1.19], [0.18, 0, 0]);
    stem.name = 'apple-stem';
    const leaf = add(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshStandardMaterial({ color: '#8bd36c', roughness: 0.48 }), [0.13, 0.49, 1.18]);
    leaf.scale.set(1.55, 0.28, 0.58); leaf.rotation.z = -0.32;
  }
  if (id === 'big-spike') {
    add(new THREE.TorusGeometry(0.58, 0.11, 8, 24), brass, [0, 0.18, 0.82], [Math.PI / 2, 0, 0]);
    for (let index = 0; index < 5; index++) {
      const angle = index / 5 * Math.PI * 2;
      const spike = add(new THREE.ConeGeometry(index === 0 ? 0.25 : 0.18, index === 0 ? 0.88 : 0.64, 6),
        index % 2 ? steel : accent, [Math.cos(angle) * 0.46, 0.3 + (index === 0 ? 0.08 : 0), 0.76 + Math.sin(angle) * 0.38]);
      spike.rotation.z = Math.cos(angle) * 0.42;
      spike.rotation.x = Math.sin(angle) * 0.42;
    }
    for (const side of [-1, 1]) add(new THREE.BoxGeometry(0.12, 0.16, 0.46), dark, [side * 0.36, 0.02, 0.67], [0, side * 0.3, 0]);
  }
  if (id === 'bow') {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.78, 1.08), new THREE.Vector3(0.4, -0.65, 1.08),
      new THREE.Vector3(0.62, -0.3, 1.08), new THREE.Vector3(0.68, 0, 1.08),
      new THREE.Vector3(0.62, 0.3, 1.08), new THREE.Vector3(0.4, 0.65, 1.08),
      new THREE.Vector3(0, 0.78, 1.08),
    ]);
    add(new THREE.TubeGeometry(curve, 36, 0.075, 8, false), wood, [0, 0, 0]);
    const stringGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -0.78, 1.08), new THREE.Vector3(0, 0.02, 1.08), new THREE.Vector3(0, 0.72, 1.08),
    ]);
    const string = new THREE.Line(stringGeometry, new THREE.LineBasicMaterial({ color: '#edf1e8' }));
    string.name = 'bow-string'; group.add(string);
    add(new THREE.BoxGeometry(0.055, 0.055, 0.84), steel, [0, 0.02, 1.27]);
    const arrowTip = add(new THREE.ConeGeometry(0.09, 0.22, 5), brass, [0, 0.02, 1.78], [Math.PI / 2, 0, 0]);
    arrowTip.rotation.x = Math.PI / 2;
    for (const side of [-1, 1]) add(new THREE.BoxGeometry(0.06, 0.16, 0.09), accent, [side * 0.075, 0.02, 0.94], [0, 0, side * -0.35]);
  }
  if (id === 'cannon-turret') {
    const base = add(new THREE.CylinderGeometry(0.39, 0.52, 0.24, 8), dark, [0, 0.14, 0.7]);
    base.rotation.x = Math.PI / 2;
    forward(new THREE.CylinderGeometry(0.19, 0.28, 0.76, 8), accent, [0, 0.22, 1.13]);
    add(new THREE.TorusGeometry(0.22, 0.06, 8, 18), brass, [0, 0.22, 1.5]);
    add(new THREE.SphereGeometry(0.18, 12, 10), steel, [0, 0.22, 1.54]);
    for (const side of [-1, 1]) add(new THREE.BoxGeometry(0.15, 0.12, 0.45), brass, [side * 0.36, 0.12, 0.72], [0, side * 0.24, 0]);
  }
  if (id === 'axe') {
    const start = new THREE.Vector3(0.19, 0.14, 0.98);
    const end = new THREE.Vector3(0.56, 0.14, 1.86);
    addCylinderBetween(group, start, end, 0.11, 0.14, wood, 14);
    const direction = end.clone().sub(start).normalize();
    const haftAxis = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
    for (const t of [0.08, 0.16, 0.24, 0.32]) {
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.145, 0.048, 12), brass);
      band.position.copy(start).lerp(end, t); band.quaternion.copy(haftAxis); band.castShadow = true; group.add(band);
    }
    const blade = new THREE.Group();
    blade.position.copy(end);
    const across = new THREE.Vector3(-direction.z, 0, direction.x);
    const forward = new THREE.Vector3(direction.x, 0, direction.z);
    const groundPlane = new THREE.Matrix4().makeBasis(across, forward, new THREE.Vector3(0, 1, 0));
    blade.quaternion.setFromRotationMatrix(groundPlane);
    group.add(blade);

    const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.24, 14), steel);
    socket.position.copy(end).addScaledVector(direction, -0.06);
    socket.quaternion.copy(haftAxis); socket.castShadow = true; group.add(socket);

    const shadow = new THREE.Mesh(makeAxeHeadGeometry(), dark);
    shadow.scale.set(1.06, 1.06, 1);
    shadow.position.z = 0.035;
    shadow.castShadow = true; blade.add(shadow);
    const head = new THREE.Mesh(makeAxeHeadGeometry(), steel);
    head.castShadow = true; head.receiveShadow = true; blade.add(head);
    const headRivet = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 10), brass);
    headRivet.position.set(-0.32, 0, 0.09); headRivet.castShadow = true; blade.add(headRivet);

    const edgePoints = [
      ...Array.from({ length: 9 }, (_, step) => {
        const t = step / 8, inverse = 1 - t;
        return new THREE.Vector3(
          inverse * inverse * -0.57 + 2 * inverse * t * -0.96 + t * t * -1.14,
          inverse * inverse * -0.43 + 2 * inverse * t * -0.55 + t * t * -0.25, -0.045);
      }),
      ...Array.from({ length: 8 }, (_, index) => {
        const t = (index + 1) / 8, inverse = 1 - t;
        return new THREE.Vector3(
          inverse * inverse * -1.14 + 2 * inverse * t * -1.34 + t * t * -1.14,
          inverse * inverse * -0.25 + t * t * 0.25, -0.045);
      }),
      ...Array.from({ length: 8 }, (_, index) => {
        const t = (index + 1) / 8, inverse = 1 - t;
        return new THREE.Vector3(
          inverse * inverse * -1.14 + 2 * inverse * t * -0.96 + t * t * -0.57,
          inverse * inverse * 0.25 + 2 * inverse * t * 0.55 + t * t * 0.43, -0.045);
      }),
    ];
    const edgeGeometry = new THREE.BufferGeometry().setFromPoints(edgePoints);
    blade.add(new THREE.Line(edgeGeometry, new THREE.LineBasicMaterial({ color: 0xf7fbff })));
    add(new THREE.SphereGeometry(0.13, 12, 10), dark, [start.x, start.y, start.z]);
  }
  return group;
}

function makeWebVisual() {
  const points: number[] = [];
  const segment = (x1: number, z1: number, x2: number, z2: number) => points.push(x1, 0, z1, x2, 0, z2);
  for (const radius of [0.28, 0.54, 0.78, 1]) {
    const count = 24;
    for (let i = 0; i < count; i++) {
      const a = i / count * Math.PI * 2, b = (i + 1) / count * Math.PI * 2;
      segment(Math.cos(a) * radius, Math.sin(a) * radius, Math.cos(b) * radius, Math.sin(b) * radius);
    }
  }
  for (let i = 0; i < 8; i++) {
    const angle = i / 8 * Math.PI * 2;
    segment(0, 0, Math.cos(angle), Math.sin(angle));
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  const material = new THREE.LineBasicMaterial({ color: 0xa9f775, transparent: true, opacity: 0.74 });
  const group = new THREE.Group();
  group.add(new THREE.LineSegments(geometry, material));
  return group;
}

function makeDiceVisual(): DiceVisual {
  const group = new THREE.Group();
  const cube = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.66, 0.66), new THREE.MeshStandardMaterial({ color: '#f0eee5', roughness: 0.28 }));
  cube.position.y = 0.34; cube.castShadow = true; group.add(cube);
  const positions: [number, number][] = [[-0.16, -0.16], [0.16, 0.16], [0.16, -0.16], [-0.16, 0.16], [0, 0], [-0.16, 0], [0.16, 0]];
  const pips = positions.map(([x, z]) => {
    const pip = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), new THREE.MeshBasicMaterial({ color: '#26302a' }));
    pip.position.set(x, 0.68, z); pip.visible = false; group.add(pip); return pip;
  });
  group.visible = false;
  return { group, pips };
}

function makeIceBombVisual() {
  const group = new THREE.Group();
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 12), new THREE.MeshStandardMaterial({ color: '#9de7fa', roughness: 0.22, metalness: 0.28 }));
  orb.position.y = 0.34; orb.castShadow = true; group.add(orb);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.04, 7, 24), new THREE.MeshBasicMaterial({ color: '#e9fbff' }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.12; group.add(ring);
  group.visible = false;
  return group;
}

function makeAppleVisual() {
  const group = new THREE.Group(); group.visible = false;
  const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 12),
    new THREE.MeshStandardMaterial({ color: '#f26e69', roughness: 0.28, metalness: 0.12 }));
  fruit.position.y = 0.35; fruit.scale.set(0.88, 0.82, 0.96); fruit.castShadow = true; group.add(fruit);
  const crown = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8),
    new THREE.MeshStandardMaterial({ color: '#ff8b78', roughness: 0.32 }));
  crown.position.set(0, 0.46, 0); crown.scale.set(1, 0.62, 0.95); group.add(crown);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.2, 7),
    new THREE.MeshStandardMaterial({ color: '#6f492d', roughness: 0.76 }));
  stem.position.set(0, 0.63, 0); stem.rotation.z = -0.2; group.add(stem);
  const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8),
    new THREE.MeshStandardMaterial({ color: '#91d76b', roughness: 0.44 }));
  leaf.position.set(0.11, 0.68, 0); leaf.scale.set(1.45, 0.35, 0.52); leaf.rotation.z = -0.28; group.add(leaf);
  const shine = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), new THREE.MeshBasicMaterial({ color: '#fff3dd' }));
  shine.position.set(-0.16, 0.48, 0.22); group.add(shine);
  return group;
}

function makeDamageZoneVisual() {
  const group = new THREE.Group(); group.visible = false;
  const field = new THREE.Mesh(new THREE.CircleGeometry(1, 48),
    new THREE.MeshBasicMaterial({ color: '#ef9664', transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false }));
  field.rotation.x = -Math.PI / 2; field.position.y = 0.035; group.add(field);
  const rim = new THREE.Mesh(new THREE.RingGeometry(0.91, 1, 48),
    new THREE.MeshBasicMaterial({ color: '#ffb67f', transparent: true, opacity: 0.78, side: THREE.DoubleSide, depthWrite: false }));
  rim.rotation.x = -Math.PI / 2; rim.position.y = 0.045; group.add(rim);
  for (let index = 0; index < 6; index++) {
    const angle = index / 6 * Math.PI * 2;
    const marker = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.34, 5),
      new THREE.MeshStandardMaterial({ color: '#ffd3a1', emissive: '#a55232', emissiveIntensity: 0.24 }));
    marker.position.set(Math.cos(angle) * 0.96, 0.13, Math.sin(angle) * 0.96);
    marker.rotation.z = -Math.cos(angle) * 0.82; marker.rotation.x = Math.sin(angle) * 0.82; group.add(marker);
  }
  return group;
}

function makeHookProjectileVisual() {
  const group = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.075, 0.45, 7), new THREE.MeshStandardMaterial({ color: '#8d6948', roughness: 0.74 }));
  shaft.rotation.x = Math.PI / 2; shaft.position.z = 0.1; group.add(shaft);
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0.25), new THREE.Vector3(0.18, 0, 0.43), new THREE.Vector3(0.37, 0, 0.38),
    new THREE.Vector3(0.41, 0, 0.2), new THREE.Vector3(0.28, 0, 0.12), new THREE.Vector3(0.18, 0, 0.23),
  ]);
  group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 14, 0.065, 7, false), new THREE.MeshStandardMaterial({ color: '#d7e0e5', metalness: 0.84, roughness: 0.22 })));
  group.visible = false;
  return group;
}

function makeShotFlashVisual(weapon: string, color: string) {
  const group = new THREE.Group();
  const add = (geometry: THREE.BufferGeometry, tint: string, position: [number, number, number], rotation: [number, number, number] = [0, 0, 0]) => {
    const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: tint, transparent: true, opacity: 0.95, depthWrite: false }));
    mesh.position.set(...position); mesh.rotation.set(...rotation); group.add(mesh);
  };
  if (weapon === 'thief') {
    add(new THREE.BoxGeometry(0.035, 0.035, 0.46), '#fff6df', [0, 0, 0.18]);
    add(new THREE.TetrahedronGeometry(0.09), color, [-0.08, 0, 0.12], [0, 0, Math.PI / 4]);
    add(new THREE.TetrahedronGeometry(0.075), '#ffffff', [0.1, 0, 0.28], [0.2, 0, Math.PI / 4]);
  } else if (weapon === 'glass') {
    for (let index = 0; index < 5; index++) {
      const angle = index / 5 * Math.PI * 2;
      const shard = new THREE.Mesh(new THREE.TetrahedronGeometry(0.13),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthWrite: false }));
      shard.position.set(Math.cos(angle) * 0.18, 0, Math.sin(angle) * 0.18);
      shard.rotation.set(angle, angle * 0.6, 0); group.add(shard);
    }
  } else {
    const flashColor = weapon === 'beam' ? '#76f5ff' : weapon === 'hook' ? '#f3d8a2' : color;
    add(new THREE.ConeGeometry(0.2, weapon === 'cannon' ? 0.6 : 0.44, 6), flashColor,
      [0, 0, weapon === 'cannon' ? 0.27 : 0.2], [Math.PI / 2, 0, 0]);
    add(new THREE.ConeGeometry(0.09, 0.32, 5), '#fff6d7', [0, 0, 0.18], [Math.PI / 2, 0, 0]);
    for (const side of [-1, 1]) {
      const spark = new THREE.Mesh(new THREE.TetrahedronGeometry(0.075),
        new THREE.MeshBasicMaterial({ color: flashColor, transparent: true, opacity: 0.9, depthWrite: false }));
      spark.position.set(side * 0.13, 0, 0.05); spark.rotation.z = side * 0.6; group.add(spark);
    }
  }
  if (weapon === 'machine-gun') group.scale.setScalar(0.74);
  if (weapon === 'cannon') group.scale.setScalar(1.25);
  return group;
}

function makeBulletVisual() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.31, 8),
    new THREE.MeshStandardMaterial({ color: '#cbd6df', metalness: 0.88, roughness: 0.2 }));
  body.rotation.x = Math.PI / 2; body.castShadow = true; group.add(body);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.16, 8),
    new THREE.MeshStandardMaterial({ color: '#ffd17d', metalness: 0.72, roughness: 0.22, emissive: '#ff9d3d', emissiveIntensity: 0.2 }));
  tip.rotation.x = Math.PI / 2; tip.position.z = 0.22; tip.castShadow = true; group.add(tip);
  return group;
}

function makeCannonballVisual() {
  const group = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.23, 14, 12),
    new THREE.MeshStandardMaterial({ color: '#34383a', metalness: 0.78, roughness: 0.28 }));
  shell.castShadow = true; group.add(shell);
  const ember = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8),
    new THREE.MeshBasicMaterial({ color: '#ff9b62' }));
  ember.position.z = 0.17; group.add(ember);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.045, 0.08),
    new THREE.MeshStandardMaterial({ color: '#9ca7a8', metalness: 0.86, roughness: 0.22 }));
  fin.position.z = -0.16; fin.castShadow = true; group.add(fin);
  return group;
}

function makeArrowVisual() {
  const group = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.027, 0.027, 0.78, 7),
    new THREE.MeshStandardMaterial({ color: '#8a5c34', roughness: 0.72 }));
  shaft.rotation.x = Math.PI / 2; shaft.castShadow = true; group.add(shaft);
  const point = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.24, 5),
    new THREE.MeshStandardMaterial({ color: '#d9e0e2', metalness: 0.9, roughness: 0.2 }));
  point.rotation.x = Math.PI / 2; point.position.z = 0.47; point.castShadow = true; group.add(point);
  for (const side of [-1, 1]) {
    const feather = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.035, 0.24),
      new THREE.MeshStandardMaterial({ color: side < 0 ? '#d9a76d' : '#f4e5c8', roughness: 0.62 }));
    feather.position.set(side * 0.055, 0, -0.32); feather.rotation.y = side * -0.3; group.add(feather);
  }
  group.visible = false;
  return group;
}

function makeCannonTurretVisual() {
  const group = new THREE.Group(); group.visible = false;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.22, 8),
    new THREE.MeshStandardMaterial({ color: '#313b39', metalness: 0.72, roughness: 0.34 }));
  base.position.y = 0.12; base.castShadow = true; group.add(base);
  const turntable = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.14, 8),
    new THREE.MeshStandardMaterial({ color: '#d5a36c', metalness: 0.76, roughness: 0.28 }));
  turntable.position.y = 0.3; turntable.castShadow = true; group.add(turntable);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.23, 0.82, 8),
    new THREE.MeshStandardMaterial({ color: '#ffa36b', metalness: 0.64, roughness: 0.3 }));
  barrel.rotation.x = Math.PI / 2; barrel.position.set(0, 0.43, 0.24); barrel.castShadow = true; group.add(barrel);
  const muzzle = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.055, 8, 18),
    new THREE.MeshStandardMaterial({ color: '#e0e5df', metalness: 0.9, roughness: 0.2 }));
  muzzle.position.set(0, 0.43, 0.66); group.add(muzzle);
  for (const side of [-1, 1]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.12, 10),
      new THREE.MeshStandardMaterial({ color: '#a9794c', metalness: 0.58, roughness: 0.38 }));
    wheel.rotation.z = Math.PI / 2; wheel.position.set(side * 0.42, 0.16, 0); group.add(wheel);
  }
  return group;
}

function makeKnifeProjectileVisual() {
  const group = new THREE.Group();
  const wood = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.28, 7),
    new THREE.MeshStandardMaterial({ color: '#684626', roughness: 0.7 }));
  wood.rotation.x = Math.PI / 2; wood.position.z = -0.12; group.add(wood);
  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.065, 0.07),
    new THREE.MeshStandardMaterial({ color: '#caa45e', metalness: 0.82, roughness: 0.25 }));
  guard.position.z = 0.02; group.add(guard);
  const blade = new THREE.Mesh(makeExtrudedPolygonGeometry([
    [-0.08, 0], [-0.07, 0.24], [0, 0.56], [0.07, 0.24], [0.08, 0],
  ], 0.045), new THREE.MeshStandardMaterial({ color: '#dce6ee', metalness: 0.9, roughness: 0.18 }));
  blade.rotation.x = Math.PI / 2; blade.position.z = 0.02; blade.castShadow = true; group.add(blade);
  return group;
}

function makeRocketVisual() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.42, 8),
    new THREE.MeshStandardMaterial({ color: '#de7a43', metalness: 0.3, roughness: 0.38 }));
  body.rotation.x = Math.PI / 2; body.castShadow = true; group.add(body);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.25, 8),
    new THREE.MeshStandardMaterial({ color: '#f6bc72', metalness: 0.54, roughness: 0.24 }));
  nose.rotation.x = Math.PI / 2; nose.position.z = 0.31; nose.castShadow = true; group.add(nose);
  for (const side of [-1, 1]) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.045, 0.17),
      new THREE.MeshStandardMaterial({ color: '#35413e', metalness: 0.64, roughness: 0.32 }));
    fin.position.set(side * 0.12, 0, -0.17); fin.rotation.y = side * 0.2; group.add(fin);
  }
  return group;
}

export class Arena {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-14, 14, 11, -11, 0.1, 100);
  private balls: THREE.Group[] = [];
  private trails: THREE.Mesh[][] = [];
  private ballBaseColors: string[] = [];
  private cosmeticTints: THREE.Color[] = [];
  private colorScratch = new THREE.Color();
  private previous: { x: number; y: number }[] = [];
  private flashes: { mesh: THREE.Mesh; life: number }[] = [];
  private muzzleFlashes: TimedGroup[] = [];
  private powerSparks: PowerSpark[] = [];
  private damageBubbles: { sprite: THREE.Sprite; life: number; rise: number }[] = [];
  private observer: ResizeObserver;
  private aimArrow: THREE.ArrowHelper;
  private projectiles: ProjectileVisual[] = [];
  private abilityGroups: (THREE.Group | null)[] = [];
  private abilityIds: (string | null)[] = [];
  private chargeCrystals: THREE.Mesh[] = [];
  private beamStrips: EnergyStrip[] = [];
  private laserStrips: EnergyStrip[] = [];
  private hookTetherStrips: EnergyStrip[] = [];
  private webVisuals: THREE.Group[] = [];
  private spikeVisuals: THREE.Group[] = [];
  private turretVisuals: THREE.Group[] = [];
  private zoneVisuals: THREE.Group[] = [];
  private appleVisuals: THREE.Group[] = [];
  private diceVisuals: DiceVisual[] = [];
  private iceBombVisuals: THREE.Group[] = [];
  private chessRouteVisuals: (THREE.Line | null)[] = [];
  private chessRouteKeys: string[] = [];
  private fxClock = 0;
  private axeAngles = [0, 0, 0, 0];
  private axeAngleReady = [false, false, false, false];
  private recoil = [0, 0, 0, 0];
  private lowEffects = false;
  private reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  constructor(private container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.domElement.setAttribute('aria-label', 'Arena 3D automatycznego lokalnego pojedynku');
    this.renderer.domElement.setAttribute('role', 'img');
    container.append(this.renderer.domElement);
    this.camera.position.set(0, 30, 13);
    this.camera.lookAt(0, 0, 0);
    this.scene.add(new THREE.HemisphereLight(0xe8fff2, 0x26342d, 2.5));
    const key = new THREE.DirectionalLight(0xfff4dd, 4);
    key.position.set(-7, 16, 7);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, { left: -14, right: 14, top: 12, bottom: -12 });
    key.shadow.bias = -0.001;
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0x8adfcf, 2);
    fill.position.set(12, 6, -10); this.scene.add(fill);

    const box = (w: number, h: number, d: number, x: number, y: number, z: number, color: number) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({ color, roughness: 0.65, metalness: 0.2 }));
      mesh.position.set(x, y, z); mesh.receiveShadow = true; mesh.castShadow = true;
      this.scene.add(mesh); return mesh;
    };
    box(21.1, 0.65, 21.1, 0, -0.48, 0, 0x263d35);
    box(20, 0.15, 20, 0, -0.08, 0, 0x162b25);
    for (const sign of [-1, 1]) {
      box(20.5, 0.48, 0.28, 0, 0.15, sign * 10.14, 0x4c6b58);
      box(0.28, 0.48, 20.5, sign * 10.14, 0.15, 0, 0x4c6b58);
      box(20.5, 0.035, 0.06, 0, 0.41, sign * 10.14, 0xc2e49b);
      box(0.06, 0.035, 20.5, sign * 10.14, 0.41, 0, 0xc2e49b);
    }
    const lines: number[] = [];
    for (let x = -9; x <= 9; x++) lines.push(x, 0.012, -10, x, 0.012, 10);
    for (let y = -9; y <= 9; y++) lines.push(-10, 0.012, y, 10, 0.012, y);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3));
    this.scene.add(new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0x294237 })));
    const ring = new THREE.Mesh(new THREE.RingGeometry(2.3, 2.33, 80),
      new THREE.MeshBasicMaterial({ color: 0x73917a, transparent: true, opacity: 0.45, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.023; this.scene.add(ring);
    for (let z = -9.5; z < 10; z += 0.8) box(0.035, 0.01, 0.36, 0, 0.025, z, 0x4b6655);
    this.aimArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 4.2, 0xd7f786, 0.7, 0.42);
    this.aimArrow.visible = false;
    this.scene.add(this.aimArrow);

    for (let index = 0; index < 4; index++) {
      const def = BASIC_BALLS[index % 2];
      const group = new THREE.Group();
      const orb = new THREE.Mesh(new THREE.SphereGeometry(def.radius, 40, 28),
        new THREE.MeshPhysicalMaterial({ color: def.color, metalness: 0.45, roughness: 0.22,
          clearcoat: 1, clearcoatRoughness: 0.15 }));
      orb.castShadow = true; orb.receiveShadow = true; group.add(orb);
      const satellite = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8),
        new THREE.MeshBasicMaterial({ color: 0xff9dd5 }));
      satellite.visible = false; group.add(satellite);
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.23, 0),
        new THREE.MeshBasicMaterial({ color: 0x48eaff, transparent: true, opacity: 0.95 }));
      crystal.position.set(0, 0.48, 1.24); crystal.visible = false; group.add(crystal);
      this.chargeCrystals.push(crystal);
      this.abilityGroups.push(null); this.abilityIds.push(null);
      this.balls.push(group); this.scene.add(group);
      const trail: THREE.Mesh[] = [];
      for (let i = 0; i < 12; i++) {
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6),
          new THREE.MeshBasicMaterial({ color: def.color, transparent: true, opacity: 0.22 * (1 - i / 12) }));
        mesh.visible = false; this.scene.add(mesh); trail.push(mesh);
      }
      this.trails.push(trail);
    }
    for (let i = 0; i < 4; i++) {
      const beam = makeEnergyStrip(); beam.group.visible = false; this.scene.add(beam.group); this.beamStrips.push(beam);
    }
    for (let i = 0; i < 16; i++) {
      const laser = makeEnergyStrip(); laser.group.visible = false; this.scene.add(laser.group); this.laserStrips.push(laser);
      const web = makeWebVisual(); web.visible = false; this.scene.add(web); this.webVisuals.push(web);
    }
    for (let i = 0; i < 4; i++) {
      const tether = makeEnergyStrip(); tether.group.visible = false; this.scene.add(tether.group); this.hookTetherStrips.push(tether);
    }
    for (let i = 0; i < 32; i++) {
      const spike = new THREE.Group(); spike.visible = false;
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.78, 6),
        new THREE.MeshStandardMaterial({ color: '#8fd174', roughness: 0.34, metalness: 0.24 }));
      tip.position.y = 0.4; tip.castShadow = true; spike.add(tip);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.3, 0.12, 8),
        new THREE.MeshStandardMaterial({ color: '#486b38', roughness: 0.62 }));
      base.position.y = 0.06; spike.add(base);
      for (const side of [-1, 1]) {
        const thorn = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.54, 5),
          new THREE.MeshStandardMaterial({ color: '#e9a36c', metalness: 0.48, roughness: 0.3 }));
        thorn.position.set(side * 0.31, 0.23, 0); thorn.rotation.z = side * -0.74; thorn.visible = false; thorn.castShadow = true; spike.add(thorn);
      }
      this.scene.add(spike); this.spikeVisuals.push(spike);
    }
    for (let i = 0; i < 12; i++) {
      const turret = makeCannonTurretVisual(); this.scene.add(turret); this.turretVisuals.push(turret);
    }
    for (let i = 0; i < 20; i++) {
      const die = makeDiceVisual(); this.scene.add(die.group); this.diceVisuals.push(die);
    }
    for (let i = 0; i < 8; i++) {
      const bomb = makeIceBombVisual(); this.scene.add(bomb); this.iceBombVisuals.push(bomb);
    }
    for (let i = 0; i < 4; i++) {
      const zone = makeDamageZoneVisual(); this.scene.add(zone); this.zoneVisuals.push(zone);
    }
    for (let i = 0; i < 16; i++) {
      const apple = makeAppleVisual(); this.scene.add(apple); this.appleVisuals.push(apple);
    }
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(container);
    this.resize();
  }

  private ensureBallSlots(count: number) {
    while (this.balls.length < count) {
      const index = this.balls.length, def = BASIC_BALLS[index % 2];
      const group = new THREE.Group();
      const orb = new THREE.Mesh(new THREE.SphereGeometry(def.radius, 40, 28),
        new THREE.MeshPhysicalMaterial({ color: def.color, metalness: 0.45, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.15 }));
      orb.castShadow = true; orb.receiveShadow = true; group.add(orb);
      const satellite = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), new THREE.MeshBasicMaterial({ color: 0xff9dd5 }));
      satellite.visible = false; group.add(satellite);
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.23, 0),
        new THREE.MeshBasicMaterial({ color: 0x48eaff, transparent: true, opacity: 0.95 }));
      crystal.position.set(0, 0.48, 1.24); crystal.visible = false; group.add(crystal);
      this.chargeCrystals.push(crystal); this.abilityGroups.push(null); this.abilityIds.push(null);
      this.balls.push(group); this.scene.add(group);
      const trail: THREE.Mesh[] = [];
      for (let i = 0; i < 12; i++) {
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6),
          new THREE.MeshBasicMaterial({ color: def.color, transparent: true, opacity: 0.22 * (1 - i / 12) }));
        mesh.visible = false; this.scene.add(mesh); trail.push(mesh);
      }
      this.trails.push(trail);
    }
  }

  private resize() {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h);
    const aspect = w / h;
    const halfHeight = Math.max(10.8, 11.5 / aspect);
    this.camera.left = -halfHeight * aspect; this.camera.right = halfHeight * aspect;
    this.camera.top = halfHeight; this.camera.bottom = -halfHeight;
    this.camera.updateProjectionMatrix();
  }

  setLowEffects(low: boolean) {
    this.lowEffects = low;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, low ? 1 : 1.75));
    this.renderer.shadowMap.enabled = !low;
    this.resize();
    if (low) this.trails.forEach(trail => trail.slice(4).forEach(particle => { particle.visible = false; }));
  }

  reset(w: World) {
    this.previous = w.balls.map(b => ({ x: b.x, y: b.y }));
    this.zoneVisuals.forEach(zone => { zone.visible = false; });
    this.appleVisuals.forEach(apple => { apple.visible = false; });
    this.turretVisuals.forEach(turret => { turret.visible = false; });
    this.chessRouteVisuals.forEach(mesh => { if (mesh) { this.scene.remove(mesh); mesh.geometry.dispose(); (mesh.material as THREE.Material).dispose(); } });
    this.chessRouteVisuals = []; this.chessRouteKeys = [];
    this.diceVisuals.forEach(die => { die.group.visible = false; });
    this.iceBombVisuals.forEach(bomb => { bomb.visible = false; });
    this.trails.flat().forEach(t => { t.visible = false; });
    this.flashes.forEach(f => { this.scene.remove(f.mesh); f.mesh.geometry.dispose(); (f.mesh.material as THREE.Material).dispose(); });
    this.flashes = [];
    this.muzzleFlashes.forEach(flash => {
      this.scene.remove(flash.group);
      flash.group.traverse(object => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => material.dispose());
      });
    });
    this.muzzleFlashes = []; this.recoil.fill(0);
    this.powerSparks.forEach(spark => {
      this.scene.remove(spark.mesh); spark.mesh.geometry.dispose(); (spark.mesh.material as THREE.Material).dispose();
    });
    this.powerSparks = [];
    this.damageBubbles.forEach(({ sprite }) => {
      this.scene.remove(sprite);
      const material = sprite.material as THREE.SpriteMaterial;
      material.map?.dispose(); material.dispose();
    });
    this.damageBubbles = [];
    this.projectiles.forEach(({ orb, shard, streak, hook, bullet, cannonball, knife, rocket, arrow }) => {
      orb.visible = false; shard.visible = false; streak.visible = false; hook.visible = false;
      bullet.visible = false; cannonball.visible = false; knife.visible = false; rocket.visible = false; arrow.visible = false;
    });
  }

  setAimPreview(w: World, index: number, angle: number) {
    const ball = w.balls[index];
    if (!ball) return;
    this.aimArrow.position.set(ball.x, ball.radius + 0.32, ball.y);
    this.aimArrow.setDirection(new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)));
    this.aimArrow.visible = true;
    this.container.style.cursor = 'crosshair';
    this.container.classList.add('aim-enabled');
  }

  clearAimPreview() {
    this.aimArrow.visible = false;
    this.container.style.cursor = '';
    this.container.classList.remove('aim-enabled');
  }

  angleFromPointer(event: PointerEvent, ball: { x: number; y: number }): number | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const pointer = new THREE.Vector2((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(pointer, this.camera);
    const point = new THREE.Vector3();
    if (!ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), point)) return null;
    if (Math.hypot(point.x - ball.x, point.z - ball.y) < 0.3) return null;
    return Math.atan2(point.z - ball.y, point.x - ball.x);
  }

  setBallColor(index: number, color: string) {
    const group = this.balls[index];
    if (!group) return;
    this.ballBaseColors[index] = color;
    const orb = group.children[0] as THREE.Mesh;
    this.colorScratch.set(color);
    if (this.cosmeticTints[index]) this.colorScratch.lerp(this.cosmeticTints[index], 0.18);
    (orb.material as THREE.MeshPhysicalMaterial).color.copy(this.colorScratch);
    for (const particle of this.trails[index]) (particle.material as THREE.MeshBasicMaterial).color.set(color);
  }

  setBallAbility(index: number, abilityId: string | null) {
    this.ensureBallSlots(index + 1);
    const group = this.balls[index];
    if (!group || this.abilityIds[index] === abilityId) return;
    const previous = this.abilityGroups[index];
    if (previous) {
      previous.parent?.remove(previous);
      previous.traverse(object => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach(material => material.dispose());
        }
      });
    }
    this.abilityIds[index] = abilityId;
    this.chargeCrystals[index].visible = abilityId === 'beam';
    if (!abilityId) { this.abilityGroups[index] = null; return; }
    const definition = MATCH_BALLS.find(ball => ball.id === abilityId);
    if (!definition) { this.abilityGroups[index] = null; return; }
    const signature = makeBallSignature(definition.id, definition.color);
    if (definition.id === 'axe') signature.scale.setScalar(AXE_VISUAL_SCALE);
    if (definition.id === 'axe' || definition.id === 'snake') this.scene.add(signature);
    else group.add(signature);
    this.axeAngleReady[index] = false;
    this.abilityGroups[index] = signature;
  }

  setBallCosmetic(index: number, cosmeticId: string) {
    if (!this.balls[index]) return;
    const cosmetic = COSMETICS.find(item => item.id === cosmeticId) ?? COSMETICS[0];
    this.cosmeticTints[index] = new THREE.Color(cosmetic.color);
    if (this.ballBaseColors[index]) this.setBallColor(index, this.ballBaseColors[index]);
  }

  beforeStep(w: World) { this.previous = w.balls.map(b => ({ x: b.x, y: b.y })); }

  private showDamageBubble(x: number, y: number, amount: number) {
    if (this.damageBubbles.length >= (this.lowEffects ? 6 : 14)) return;
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 128;
    const context = canvas.getContext('2d')!;
    context.shadowColor = '#000b'; context.shadowBlur = 16;
    context.fillStyle = '#241b18e8';
    context.strokeStyle = '#ff8b68'; context.lineWidth = 5;
    context.beginPath(); context.roundRect(25, 20, 206, 82, 36); context.fill(); context.stroke();
    context.shadowBlur = 0;
    context.fillStyle = '#fff4e8'; context.font = '800 52px system-ui, sans-serif';
    context.textAlign = 'center'; context.textBaseline = 'middle';
    context.fillText(`-${Math.max(1, Math.round(amount))}`, 128, 61);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(x, 2.35, y); sprite.scale.set(2.5, 1.25, 1); sprite.renderOrder = 10;
    this.scene.add(sprite);
    this.damageBubbles.push({ sprite, life: 0.9, rise: this.reducedMotion.matches ? 0 : 1.1 });
  }

  private updateChessRoute(index: number, ball: World['balls'][number]) {
    const active = (ball.chessPhase === 'aim' || ball.chessPhase === 'attack') && ball.chessPath.length > 0;
    const key = active ? `${ball.chessPhase}:${ball.chessPattern}:${ball.chessPath.map(path => `${path.x1},${path.y1},${path.x2},${path.y2}`).join(';')}` : '';
    if (this.chessRouteKeys[index] === key) return;
    const previous = this.chessRouteVisuals[index];
    if (previous) { this.scene.remove(previous); previous.geometry.dispose(); (previous.material as THREE.Material).dispose(); }
    this.chessRouteVisuals[index] = null; this.chessRouteKeys[index] = key;
    if (!active) return;
    const positions = ball.chessPath.flatMap(path => [path.x1, 0.11, path.y1, path.x2, 0.11, path.y2]);
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.LineBasicMaterial({ color: ball.chessPhase === 'aim' ? '#e2d4af' : '#fff4cf', transparent: true, opacity: ball.chessPhase === 'aim' ? 0.82 : 0.96 });
    const line = new THREE.LineSegments(geometry, material);
    this.scene.add(line); this.chessRouteVisuals[index] = line;
  }

  afterStep(w: World) {
    for (const event of w.events.filter(e => e.type === 'damage' && e.amount).slice(0, this.lowEffects ? 2 : 5))
      this.showDamageBubble(event.x, event.y, event.amount!);
    if (this.reducedMotion.matches) return;
    for (const event of w.events.filter(e => e.type === 'power' || e.type === 'impact').slice(0, this.lowEffects ? 2 : 6)) {
      const maxSparks = this.lowEffects ? 10 : 28;
      const count = event.type === 'impact' ? 4 : 5;
      for (let i = 0; i < count && this.powerSparks.length < maxSparks; i++) {
        const baseAngle = event.angle ?? this.fxClock * 0.45;
        const angle = event.type === 'impact'
          ? baseAngle + (i - (count - 1) / 2) * 0.78
          : baseAngle + i / count * Math.PI * 2;
        const speed = event.type === 'impact' ? 2.8 + (i % 3) * 0.55 : 1.8 + (i % 3) * 0.42;
        const life = event.type === 'impact' ? 0.24 + (i % 2) * 0.06 : 0.32 + (i % 2) * 0.1;
        const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.13 + (i % 2) * 0.035, 0),
          new THREE.MeshBasicMaterial({ color: event.color ?? 0xf1f6cb, transparent: true, opacity: 0.95, depthWrite: false }));
        mesh.position.set(event.x, event.elevation ?? 0.38, event.y);
        mesh.rotation.set(angle, angle * 0.6, 0);
        this.scene.add(mesh);
        this.powerSparks.push({ mesh, life, maxLife: life, vx: Math.cos(angle) * speed, vz: Math.sin(angle) * speed, spin: 5 + i });
      }
    }
    for (const event of w.events.filter(e => e.type === 'shot').slice(0, this.lowEffects ? 2 : 8)) {
      const weapon = event.weapon ?? 'projectile';
      const group = makeShotFlashVisual(weapon, event.color ?? '#fff4d7');
      group.position.set(event.x, event.elevation ?? 1.48, event.y);
      if (event.angle !== undefined) group.rotation.y = Math.PI / 2 - event.angle;
      this.scene.add(group);
      this.muzzleFlashes.push({ group, life: weapon === 'glass' ? 0.16 : 0.1, maxLife: weapon === 'glass' ? 0.16 : 0.1 });
      if (event.owner !== undefined && event.owner >= 0 && event.owner < this.recoil.length)
        this.recoil[event.owner] = Math.max(this.recoil[event.owner], weapon === 'cannon' ? 0.22 : 0.15);
    }
    for (const event of w.events.filter(e => e.type === 'impact' && (e.weapon === 'axe' || e.weapon === 'blade')).slice(0, this.lowEffects ? 1 : 3)) {
      const slash = new THREE.Mesh(new THREE.RingGeometry(0.72, 1.08, 24, 1, -0.74, 1.48),
        new THREE.MeshBasicMaterial({ color: event.color ?? '#e8f1f7', transparent: true, opacity: 0.88, side: THREE.DoubleSide }));
      slash.rotation.set(-Math.PI / 2, -(event.angle ?? 0), 0);
      slash.position.set(event.x, event.elevation ?? 0.5, event.y);
      this.scene.add(slash); this.flashes.push({ mesh: slash, life: 0.18 });
    }
    for (const event of w.events.filter(e => e.type === 'beam' ||
      (e.type === 'hit' && e.weapon !== 'axe' && e.weapon !== 'blade')).slice(0, this.lowEffects ? 2 : 5)) {
      if (this.flashes.length >= (this.lowEffects ? 5 : 12)) break;
      const radius = event.radius ?? (event.type === 'hit' ? 0.7 : 1.1);
      const geometry = event.type === 'beam'
        ? new THREE.BoxGeometry(event.axis === 'x' ? 19 : 0.12, 0.04, event.axis === 'y' ? 19 : 0.12)
        : new THREE.RingGeometry(radius * 0.88, radius, 40);
      const mesh = new THREE.Mesh(geometry,
        new THREE.MeshBasicMaterial({ color: event.color ?? 0xf1f6cb, transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
      if (event.type !== 'beam') mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(event.type === 'beam' && event.axis === 'x' ? 0 : event.x, 0.08, event.type === 'beam' && event.axis === 'y' ? 0 : event.y);
      this.scene.add(mesh); this.flashes.push({ mesh, life: 0.4 });
    }
  }

  render(w: World, alpha: number, delta: number, moving: boolean) {
    this.ensureBallSlots(w.balls.length);
    if (moving) this.fxClock += delta;
    const effectDelta = moving || w.phase === 'finished' ? delta : 0;
    this.recoil = this.recoil.map(value => Math.max(0, value - effectDelta * 2.8));
    w.balls.forEach((b, i) => {
      const p = this.previous[i] ?? b;
      const x = THREE.MathUtils.lerp(p.x, b.x, alpha), y = THREE.MathUtils.lerp(p.y, b.y, alpha);
      const group = this.balls[i]; group.position.set(x, b.radius + 0.04, y);
      group.scale.setScalar(b.hp <= 0 ? 0.35 : b.radius / BASIC_BALLS[i%2].radius);
      const signature = this.abilityGroups[i];
      if (signature) {
        signature.visible = b.hp > 0;
        signature.position.set(0, 0, 0);
        signature.rotation.set(0, 0, 0);
        if (b.abilityId === 'axe') {
          // Keep the weapon on the arena floor, independent from the ball's rolling tilt.
          signature.visible = b.hp > 0;
          signature.position.set(x, 0.16, y);
          if (!this.axeAngleReady[i]) {
            this.axeAngles[i] = b.axeAngle;
            this.axeAngleReady[i] = true;
          } else if (!this.reducedMotion.matches) {
            const difference = Math.atan2(Math.sin(b.axeAngle - this.axeAngles[i]), Math.cos(b.axeAngle - this.axeAngles[i]));
            this.axeAngles[i] += difference * Math.min(1, delta * 24);
          }
          signature.rotation.y = this.reducedMotion.matches ? 0 : -this.axeAngles[i];
        }
        if (b.abilityId === 'snake') {
          signature.position.set(x, 0.08, y);
          const head = signature.getObjectByName('snake-head');
          if (head) head.rotation.y = Math.atan2(b.vx, b.vy);
          const segments = signature.children.filter(child => child.name === 'snake-segment');
          segments.forEach((segment, index) => {
            const position = b.snakeSegments[index];
            segment.visible = b.hp > 0 && index < b.snakeSegmentCount && !!position;
            if (!position) return;
            segment.position.set(position.x - x, 0.22, position.y - y);
            const sway = this.reducedMotion.matches ? 0 : Math.sin(this.fxClock * 7 - index * 0.55) * 0.08;
            segment.rotation.y = sway;
            segment.position.y += this.reducedMotion.matches ? 0 : Math.sin(this.fxClock * 6 - index * 0.48) * 0.025;
          });
        }
        const enemies = w.balls.filter(candidate => candidate.hp > 0 && candidate.team !== b.team)
          .sort((a, other) => Math.hypot(a.x - b.x, a.y - b.y) - Math.hypot(other.x - b.x, other.y - b.y));
        const target = enemies[0];
        if (target && ['beam', 'machine', 'machine-gun', 'cannon', 'orange', 'steel', 'thief', 'hook'].includes(b.abilityId ?? ''))
          signature.rotation.y = Math.atan2(target.x - x, target.y - y);
        if (!this.reducedMotion.matches) {
          const spinRate: Record<string, number> = {
            amber: 0.7, jade: 0.52, violet: 0.9, gold: 1.35, cyan: 0.72, pink: 0.9, laser: 0.85,
            blade: 0.8, charge: 0.16, glass: 0.22, 'poison-spike': 0.24,
            chess: 0.12, dice: 0.32, electric: 1.2, 'ice-cone': 0.55, zone: 0.38, apple: 0.22,
          };
          if (b.abilityId !== 'axe' && spinRate[b.abilityId ?? '']) signature.rotation.y = b.abilityId === 'blade'
            ? -b.bladeAngle : this.fxClock * spinRate[b.abilityId ?? ''];
          if (b.abilityId === 'spider') {
            signature.rotation.y = this.fxClock * 0.32;
            signature.children.forEach(leg => {
              if (!(leg instanceof THREE.Mesh) || leg.name !== 'spider-leg') return;
              const rest = leg.userData.restRotation as { x: number; y: number; z: number };
              const phase = leg.userData.phase as number;
              leg.rotation.set(rest.x + Math.sin(this.fxClock * 10 + phase) * 0.24,
                rest.y, rest.z + Math.cos(this.fxClock * 10 + phase) * 0.2);
            });
          }
          signature.children.forEach(part => {
            if (!(part instanceof THREE.Mesh)) return;
            if (part.name === 'vampire-wing') {
              const side = part.userData.side as number;
              part.rotation.z = this.reducedMotion.matches ? 0 : Math.sin(this.fxClock * 4.2 + side * 0.35) * side * 0.16;
            }
            if (part.name === 'cell-cilium') {
              const phase = part.userData.phase as number;
              const rest = part.userData.restQuaternion as THREE.Quaternion;
              part.quaternion.copy(rest);
              if (!this.reducedMotion.matches) part.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(
                new THREE.Vector3(0, 0, 1), Math.sin(this.fxClock * 5 + phase) * 0.11));
            }
          });
          const refCompanion = signature.getObjectByName('reforge-companion');
          if (refCompanion) {
            refCompanion.visible = b.reforgeActive;
            const angle = this.reducedMotion.matches ? 0 : b.reforgeAngle;
            const radius = 2 + Math.cos(angle) * 0.45;
            refCompanion.position.set(Math.cos(angle) * radius, 0.3, Math.sin(angle) * radius);
            refCompanion.rotation.y = -angle;
            refCompanion.scale.setScalar(0.9 + Math.min(1, b.reforgeDamage / 11) * 0.2);
          }
          const electricBolt = signature.getObjectByName('electric-bolt') as THREE.Mesh | undefined;
          if (electricBolt) (electricBolt.material as THREE.MeshStandardMaterial).emissiveIntensity =
            0.45 + (this.reducedMotion.matches ? 0 : (Math.sin(this.fxClock * 13) + 1) * 0.5);
          const rotors = signature.userData.rotors as THREE.Group[] | undefined;
          const reloading = b.machineReloadUntil > w.tick;
          rotors?.forEach(rotor => { rotor.rotation.y = this.fxClock * (reloading ? 2.4 : 18) + (rotor.userData.phase as number); });
          if (reloading) signature.children.forEach(part => {
            if (part instanceof THREE.Mesh && part.name === 'ammo-drum') part.rotation.y = this.fxClock * 2.8;
          });
        }
        if (b.abilityId === 'blade') {
          signature.rotation.y = this.reducedMotion.matches ? 0 : -b.bladeAngle;
          const orbit = signature.getObjectByName('blade-orbit');
          const blades = orbit?.userData.blades as THREE.Group[] | undefined;
          blades?.forEach((sword, index) => { sword.visible = index < b.bladeCount; });
        }
        if (b.abilityId !== 'axe' && b.abilityId !== 'snake' && this.recoil[i] > 0) {
          signature.position.set(-Math.sin(signature.rotation.y) * this.recoil[i], 0, -Math.cos(signature.rotation.y) * this.recoil[i]);
        }
      }
      const satellite = group.children[1] as THREE.Mesh;
      satellite.visible = b.echoUntil > w.tick;
      if (satellite.visible && !this.reducedMotion.matches) satellite.position.set(Math.cos(w.tick * 0.18) * b.radius * 1.5, 0.2, Math.sin(w.tick * 0.18) * b.radius * 1.5);
      const charge = this.chargeCrystals[i];
      charge.visible = b.abilityId === 'beam' && (b.beamChargeUntil > w.tick || b.beamUntil > w.tick);
      if (charge.visible && !this.reducedMotion.matches) {
        charge.rotation.x += effectDelta * 1.8;
        charge.rotation.y += effectDelta * 3.6;
        (charge.material as THREE.MeshBasicMaterial).color.set(b.beamUntil > w.tick ? '#ffffff' : '#48eaff');
      }
      if (moving && !this.reducedMotion.matches) {
        group.rotation.x += b.vy * delta * 0.7;
        group.rotation.z -= b.vx * delta * 0.7;
      }
      const trail = this.trails[i];
      if (moving && !this.reducedMotion.matches) {
        const count = this.lowEffects ? 4 : trail.length;
        for (let j = count - 1; j > 0; j--) {
          trail[j].position.copy(trail[j - 1].position); trail[j].visible = trail[j - 1].visible;
        }
        trail[0].position.set(x, 0.14, y); trail[0].visible = b.hp > 0;
      } else trail.forEach(particle => { particle.visible = false; });
      this.updateChessRoute(i, b);
    });
    this.balls.forEach((group,i)=>{group.visible=i<w.balls.length;this.trails[i].forEach(p=>{if(i>=w.balls.length)p.visible=false;});});
    this.flashes = this.flashes.filter(f => {
      f.life -= effectDelta;
      if (f.mesh.geometry instanceof THREE.RingGeometry) f.mesh.scale.addScalar(effectDelta * 5);
      (f.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, f.life * 2);
      if (f.life > 0) return true;
      this.scene.remove(f.mesh); f.mesh.geometry.dispose(); (f.mesh.material as THREE.Material).dispose(); return false;
    });
    this.muzzleFlashes = this.muzzleFlashes.filter(flash => {
      flash.life -= effectDelta;
      const progress = Math.max(0, flash.life / flash.maxLife);
      flash.group.scale.setScalar(0.72 + (1 - progress) * 0.58);
      flash.group.traverse(object => {
        if (object instanceof THREE.Mesh) (object.material as THREE.MeshBasicMaterial).opacity = progress;
      });
      if (flash.life > 0) return true;
      this.scene.remove(flash.group);
      flash.group.traverse(object => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => material.dispose());
      });
      return false;
    });
    this.powerSparks = this.powerSparks.filter(spark => {
      spark.life -= effectDelta;
      spark.mesh.position.x += spark.vx * effectDelta;
      spark.mesh.position.z += spark.vz * effectDelta;
      spark.mesh.position.y += effectDelta * 0.55;
      spark.mesh.rotation.x += spark.spin * effectDelta;
      spark.mesh.rotation.y -= spark.spin * 0.7 * effectDelta;
      spark.mesh.scale.setScalar(0.65 + Math.max(0, spark.life / spark.maxLife) * 0.45);
      (spark.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, spark.life / spark.maxLife);
      if (spark.life > 0) return true;
      this.scene.remove(spark.mesh); spark.mesh.geometry.dispose(); (spark.mesh.material as THREE.Material).dispose();
      return false;
    });
    this.damageBubbles = this.damageBubbles.filter(bubble => {
      bubble.life -= effectDelta;
      bubble.sprite.position.y += bubble.rise * effectDelta;
      bubble.sprite.material.opacity = Math.min(1, bubble.life * 2.4);
      bubble.sprite.scale.set(2.5, 1.25, 1);
      if (bubble.life > 0) return true;
      this.scene.remove(bubble.sprite);
      bubble.sprite.material.map?.dispose(); bubble.sprite.material.dispose();
      return false;
    });
    while (this.projectiles.length < w.projectiles.length) {
      const orb = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), new THREE.MeshBasicMaterial({ color: 0xff9566 }));
      const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.26, 0), new THREE.MeshStandardMaterial({ color: '#9de7fa', metalness: 0.42, roughness: 0.22 }));
      const streak = new THREE.Mesh(new THREE.BoxGeometry(1, 0.055, 0.055),
        new THREE.MeshBasicMaterial({ color: 0xff9566, transparent: true, opacity: 0.72 }));
      const hook = makeHookProjectileVisual();
      const bullet = makeBulletVisual();
      const cannonball = makeCannonballVisual();
      const knife = makeKnifeProjectileVisual();
      const rocket = makeRocketVisual();
      const arrow = makeArrowVisual();
      this.scene.add(orb, shard, streak, hook, bullet, cannonball, knife, rocket, arrow);
      this.projectiles.push({ orb, shard, streak, hook, bullet, cannonball, knife, rocket, arrow });
    }
    this.projectiles.forEach(({ orb, shard, streak, hook, bullet, cannonball, knife, rocket, arrow }, i) => {
      const shot = w.projectiles[i];
      const weapon = shot?.weapon ?? '';
      const isBullet = weapon === 'machine' || weapon === 'machine-gun';
      const isCannonball = weapon === 'cannon' || weapon === 'cannon-turret';
      const isKnife = weapon === 'thief';
      const isRocket = weapon === 'orange';
      const isArrow = shot?.kind === 'arrow';
      const isShard = shot?.kind === 'ice' || weapon === 'glass';
      orb.visible = !!shot && !isBullet && !isCannonball && !isKnife && !isRocket && !isArrow && shot.kind !== 'hook' && !isShard;
      shard.visible = !!shot && isShard;
      streak.visible = !!shot && shot.kind !== 'hook' && !isKnife && !isArrow && !this.lowEffects && !this.reducedMotion.matches;
      hook.visible = !!shot && shot.kind === 'hook';
      bullet.visible = !!shot && isBullet;
      cannonball.visible = !!shot && isCannonball;
      knife.visible = !!shot && isKnife;
      rocket.visible = !!shot && isRocket;
      arrow.visible = !!shot && isArrow;
      if (shot) {
        const owner = w.balls[shot.owner];
        const height = shot.weapon === 'cannon-turret' ? 0.58 : owner?.radius ? owner.radius + 0.14 : 0.35;
        const radius = shot.radius ?? 0.22;
        orb.position.set(shot.x, height, shot.y); orb.scale.setScalar(radius);
        (orb.material as THREE.MeshBasicMaterial).color.set(shot.color ?? '#ff9566');
        shard.position.set(shot.x, height, shot.y); shard.scale.setScalar(radius * (weapon === 'glass' ? 1.8 : 1.65));
        (shard.material as THREE.MeshStandardMaterial).color.set(shot.color ?? '#9de7fa');
        shard.rotation.y = this.reducedMotion.matches ? 0 : this.fxClock * 5;
        const speed = Math.hypot(shot.vx, shot.vy) || 1;
        streak.position.set(shot.x - shot.vx / speed * 0.34, height, shot.y - shot.vy / speed * 0.34);
        streak.rotation.y = -Math.atan2(shot.vy, shot.vx);
        streak.scale.set(Math.max(0.55, Math.min(1.25, speed * 0.045)), 1, 1);
        (streak.material as THREE.MeshBasicMaterial).color.set(shot.color ?? '#ff9566');
        const yaw = Math.PI / 2 - Math.atan2(shot.vy, shot.vx);
        hook.position.set(shot.x, height, shot.y); hook.rotation.y = yaw;
        bullet.position.set(shot.x, height, shot.y); bullet.rotation.y = yaw;
        cannonball.position.set(shot.x, height, shot.y); cannonball.rotation.y = yaw;
        knife.position.set(shot.x, height, shot.y); knife.rotation.y = yaw;
        rocket.position.set(shot.x, height, shot.y); rocket.rotation.y = yaw;
        arrow.position.set(shot.x, height, shot.y); arrow.rotation.y = yaw;
        const rocketBody = rocket.children[0] as THREE.Mesh;
        (rocketBody.material as THREE.MeshStandardMaterial).color.set(shot.color ?? '#de7a43');
        const knifeBlade = knife.children[2] as THREE.Mesh | undefined;
        if (knifeBlade) (knifeBlade.material as THREE.MeshStandardMaterial).color.set(shot.color ?? '#dce6ee');
      }
    });

    const updateStrip = (strip: EnergyStrip, color: string, opacity: number) => {
      (strip.core.material as THREE.MeshBasicMaterial).color.set(color);
      (strip.glow.material as THREE.MeshBasicMaterial).color.set(color);
      (strip.marker.material as THREE.MeshBasicMaterial).color.set('#ffffff');
      (strip.core.material as THREE.MeshBasicMaterial).opacity = opacity;
      (strip.glow.material as THREE.MeshBasicMaterial).opacity = opacity * 0.34;
      (strip.marker.material as THREE.MeshBasicMaterial).opacity = opacity;
      strip.glow.visible = !this.lowEffects;
      strip.marker.visible = !this.lowEffects && !this.reducedMotion.matches;
    };
    this.hookTetherStrips.forEach((strip, i) => {
      const tether = w.hookTethers[i];
      const owner = tether && w.balls[tether.owner], target = tether && w.balls[tether.target];
      const active = !!owner && !!target && owner.hp > 0 && target.hp > 0;
      strip.group.visible = active;
      if (!active || !owner || !target) return;
      const dx = target.x - owner.x, dz = target.y - owner.y, length = Math.hypot(dx, dz);
      strip.group.position.set((owner.x + target.x) / 2, 0.42, (owner.y + target.y) / 2);
      strip.group.rotation.y = -Math.atan2(dz, dx);
      strip.group.scale.set(length, 1, 1);
      updateStrip(strip, '#c49a72', 0.92);
    });
    this.laserStrips.forEach((strip, i) => {
      const laser = w.lasers[i];
      strip.group.visible = !!laser;
      if (!laser) return;
      const warning = w.tick < laser.warningUntil;
      const fade = warning ? 0.5 + (this.reducedMotion.matches ? 0 : Math.sin(this.fxClock * 16) * 0.24) : Math.min(1, laser.ttl / 45);
      strip.group.position.set(laser.axis === 'x' ? (laser.start + laser.end) / 2 : laser.at, 0.16,
        laser.axis === 'x' ? laser.at : (laser.start + laser.end) / 2);
      strip.group.rotation.y = laser.axis === 'x' ? 0 : Math.PI / 2;
      strip.group.scale.set(Math.abs(laser.end - laser.start), 1, 1);
      strip.marker.position.x = ((this.fxClock * 0.72 + i * 0.23) % 1 - 0.5) * 0.9;
      updateStrip(strip, warning ? '#f7d7ff' : laser.color, 0.9 * fade);
    });
    this.webVisuals.forEach((webGroup, i) => {
      const web = w.webs[i];
      webGroup.visible = !!web;
      if (!web) return;
      webGroup.position.set(web.x, 0.055, web.y);
      webGroup.scale.setScalar(web.radius);
      webGroup.rotation.y = this.reducedMotion.matches ? 0 : this.fxClock * (i % 2 ? -0.7 : 0.7);
      const lines = webGroup.children[0] as THREE.LineSegments;
      const material = lines.material as THREE.LineBasicMaterial;
      material.color.set(web.color);
      material.opacity = Math.min(0.78, web.ttl / 360);
    });
    this.beamStrips.forEach((strip, i) => {
      const ball = w.balls[i];
      const enemy = ball && w.balls.filter(candidate => candidate.hp > 0 && candidate.team !== ball.team)
        .sort((a, b) => Math.hypot(a.x - ball.x, a.y - ball.y) - Math.hypot(b.x - ball.x, b.y - ball.y))[0];
      const active = !!ball && !!enemy && ball.abilityId === 'beam' && ball.beamUntil > w.tick;
      strip.group.visible = active;
      if (!active || !ball || !enemy) return;
      const dx = enemy.x - ball.x, dz = enemy.y - ball.y;
      const distance = Math.hypot(dx, dz) || 1;
      const muzzleDistance = Math.min(ball.radius + 0.14, distance);
      const startX = ball.x + dx / distance * muzzleDistance, startY = ball.y + dz / distance * muzzleDistance;
      const length = Math.max(0.1, distance - muzzleDistance);
      strip.group.position.set((startX + enemy.x) / 2, ball.radius + 0.16, (startY + enemy.y) / 2);
      strip.group.rotation.y = -Math.atan2(dz, dx);
      strip.group.scale.set(length, 1, 1);
      strip.marker.position.x = ((this.fxClock * 2.1 + i * 0.31) % 1 - 0.5) * 0.9;
      updateStrip(strip, '#48eaff', 0.96);
    });
    this.spikeVisuals.forEach((spike, i) => {
      const trap = w.spikes[i];
      spike.visible = !!trap;
      if (!trap) return;
      spike.position.set(trap.x, 0, trap.y);
      spike.rotation.y = ((trap.owner + i) % 2 ? 1 : -1) * 0.32;
      const heavy = trap.type === 'heavy';
      spike.scale.setScalar(Math.min(1, trap.ttl / 60) * (heavy ? 1.55 : 1));
      spike.children[2].visible = heavy; spike.children[3].visible = heavy;
      const material = (spike.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial;
      material.color.set(trap.color);
      material.emissive.set(trap.color);
      material.emissiveIntensity = heavy ? 0.28 : 0.12;
      const baseMaterial = (spike.children[1] as THREE.Mesh).material as THREE.MeshStandardMaterial;
      baseMaterial.color.set(heavy ? '#75533e' : '#486b38');
      for (const thorn of spike.children.slice(2)) {
        const thornMaterial = (thorn as THREE.Mesh).material as THREE.MeshStandardMaterial;
        thornMaterial.color.set(trap.color); thornMaterial.emissive.set(trap.color); thornMaterial.emissiveIntensity = 0.2;
      }
    });
    this.turretVisuals.forEach((visual, index) => {
      const turret = w.cannonTurrets[index]; visual.visible = !!turret;
      if (!turret) return;
      visual.position.set(turret.x, 0, turret.y);
      const owner = w.balls[turret.owner];
      const target = owner && w.balls.filter(ball => ball.team !== owner.team && ball.hp > 0)
        .sort((a, b) => Math.hypot(a.x - turret.x, a.y - turret.y) - Math.hypot(b.x - turret.x, b.y - turret.y))[0];
      if (target) visual.rotation.y = Math.PI / 2 - Math.atan2(target.y - turret.y, target.x - turret.x);
      const barrelMaterial = (visual.children[2] as THREE.Mesh).material as THREE.MeshStandardMaterial;
      barrelMaterial.color.set(turret.hp <= 3 ? '#ed775d' : turret.color);
      barrelMaterial.emissive.set(turret.color); barrelMaterial.emissiveIntensity = 0.1 + (1 - turret.hp / turret.maxHp) * 0.35;
      visual.scale.setScalar(0.92 + Math.min(1, turret.ttl / 120) * 0.08);
    });
    const dicePatterns = [[], [4], [0, 1], [0, 4, 1], [0, 2, 3, 1], [0, 2, 4, 3, 1], [0, 2, 5, 6, 3, 1]];
    this.diceVisuals.forEach((die, index) => {
      const trap = w.diceTraps[index]; die.group.visible = !!trap;
      if (!trap) return;
      die.group.position.set(trap.x, 0.03, trap.y);
      die.group.rotation.y = this.reducedMotion.matches ? 0 : this.fxClock * 0.42;
      const shown = new Set(dicePatterns[trap.value] ?? dicePatterns[1]);
      die.pips.forEach((pip, pipIndex) => { pip.visible = shown.has(pipIndex); });
    });
    this.iceBombVisuals.forEach((bombVisual, index) => {
      const bomb = w.iceBombs[index]; bombVisual.visible = !!bomb;
      if (!bomb) return;
      const remaining = Math.max(0, bomb.detonateAt - w.tick) / 90;
      bombVisual.position.set(bomb.x, 0, bomb.y);
      const pulse = this.reducedMotion.matches ? 1 : 0.92 + Math.sin(this.fxClock * (8 - remaining * 2)) * 0.08;
      bombVisual.scale.setScalar(pulse);
      const orb = bombVisual.children[0] as THREE.Mesh;
      const material = orb.material as THREE.MeshStandardMaterial;
      material.color.set(bomb.color); material.emissive.set(bomb.color); material.emissiveIntensity = 0.15 + (1 - remaining / 1.5) * 0.35;
    });
    this.zoneVisuals.forEach((visual, index) => {
      const zone = w.damageZones[index]; visual.visible = !!zone;
      if (!zone) return;
      const remaining = Math.max(0, zone.ttl / 300);
      visual.position.set(zone.x, 0, zone.y);
      visual.scale.setScalar(zone.radius);
      visual.rotation.y = this.reducedMotion.matches ? 0 : this.fxClock * (index % 2 ? -0.16 : 0.16);
      const field = visual.children[0] as THREE.Mesh;
      const rim = visual.children[1] as THREE.Mesh;
      (field.material as THREE.MeshBasicMaterial).color.set(zone.color);
      (field.material as THREE.MeshBasicMaterial).opacity = 0.1 + Math.min(1, remaining * 2) * 0.09;
      (rim.material as THREE.MeshBasicMaterial).color.set('#ffb67f');
      (rim.material as THREE.MeshBasicMaterial).opacity = 0.35 + Math.min(1, remaining * 2) * 0.45;
    });
    this.appleVisuals.forEach((visual, index) => {
      const apple = w.apples[index]; visual.visible = !!apple;
      if (!apple) return;
      visual.position.set(apple.x, 0.025 + (this.reducedMotion.matches ? 0 : Math.sin(this.fxClock * 4 + index) * 0.035), apple.y);
      visual.rotation.y = this.reducedMotion.matches ? 0 : this.fxClock * 0.8 + index * 0.4;
      const remaining = Math.max(0, apple.ttl / 480);
      visual.scale.setScalar(0.86 + Math.min(1, remaining * 3) * 0.14);
      const fruit = visual.children[0] as THREE.Mesh;
      (fruit.material as THREE.MeshStandardMaterial).color.set(apple.color);
    });
    this.renderer.render(this.scene, this.camera);
  }
}
