import * as THREE from 'three';
import { BASIC_BALLS, MATCH_BALLS, RULES } from '../shared/config';
import { COSMETICS } from '../shared/progression';
import type { World } from '../simulation/world';

interface EnergyStrip { group: THREE.Group; core: THREE.Mesh; glow: THREE.Mesh; marker: THREE.Mesh; }
interface ProjectileVisual { orb: THREE.Mesh; streak: THREE.Mesh; }
interface PowerSpark { mesh: THREE.Mesh; life: number; maxLife: number; vx: number; vz: number; spin: number; }

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
    }
  }
  if (id === 'jade') {
    for (const side of [-1, 1]) {
      forward(new THREE.ConeGeometry(0.13, 0.62, 7), accent, [side * 0.34, 0.14, 1.22], [Math.PI / 2, 0, side * -0.28]);
      add(new THREE.SphereGeometry(0.055, 10, 8), steel, [side * 0.23, 0.35, 1.29]);
    }
  }
  if (id === 'violet') {
    const prism = add(new THREE.OctahedronGeometry(0.31, 0), accent, [0, 0.48, 1.18], [0.25, 0.2, 0]);
    prism.name = 'prism-core';
    add(new THREE.BoxGeometry(0.1, 0.1, 0.72), steel, [0, 0.18, 0.9]);
    add(new THREE.BoxGeometry(0.1, 0.1, 0.72), steel, [0, 0.76, 0.9]);
  }
  if (id === 'steel') {
    const shieldPoints: [number, number][] = [[-0.36, 0.42], [0.36, 0.42], [0.32, -0.1], [0.22, -0.42], [0, -0.58], [-0.22, -0.42], [-0.32, -0.1]];
    const plate = new THREE.Mesh(makeExtrudedPolygonGeometry(shieldPoints, 0.1), accent);
    plate.position.set(-1.16, 0.14, 0.52); plate.rotation.x = Math.PI / 2; plate.castShadow = true; group.add(plate);
    add(new THREE.BoxGeometry(0.08, 0.08, 0.46), steel, [-1.16, 0.18, 0.6]);
  }
  if (id === 'gold') {
    const orbit = new THREE.Group(); orbit.name = 'gold-orbit'; group.add(orbit);
    for (let shard = 0; shard < 3; shard++) {
      const angle = shard / 3 * Math.PI * 2;
      const gem = new THREE.Mesh(new THREE.TetrahedronGeometry(0.2), accent);
      gem.position.set(Math.cos(angle) * 1.5, 0.32 + (shard % 2) * 0.2, Math.sin(angle) * 1.5);
      gem.rotation.set(angle, angle * 0.6, 0); gem.castShadow = true; orbit.add(gem);
    }
  }
  if (id === 'cyan') {
    for (const [index, x] of [-0.42, 0, 0.42].entries()) {
      const shard = add(new THREE.OctahedronGeometry(index === 1 ? 0.25 : 0.18), accent,
        [x, 0.2 + (index === 1 ? 0.11 : 0), 1.22 - Math.abs(x) * 0.12], [0.25, 0, index * 0.42]);
      shard.scale.set(0.72, 0.82, 1.7);
      shard.name = 'ice-shard';
    }
  }
  if (id === 'orange') {
    add(new THREE.BoxGeometry(0.48, 0.2, 0.46), dark, [0, 0.11, 0.82]);
    forward(new THREE.CylinderGeometry(0.17, 0.22, 0.68, 10), accent, [0, 0.12, 1.2]);
    forward(new THREE.CylinderGeometry(0.12, 0.15, 0.08, 10), dark, [0, 0.12, 1.57]);
  }
  if (id === 'pink') {
    const orbit = new THREE.Group(); orbit.name = 'echo-orbit'; group.add(orbit);
    for (const side of [-1, 1]) {
      const echo = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), accent);
      echo.position.set(side * 1.32, 0.2, 0.58); echo.castShadow = true; orbit.add(echo);
      const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.12), steel);
      core.position.copy(echo.position); orbit.add(core);
    }
  }
  if (id === 'beam') {
    add(new THREE.BoxGeometry(0.48, 0.3, 0.64), dark, [0, 0.1, 0.78]);
    forward(new THREE.CylinderGeometry(0.22, 0.3, 0.58, 10), accent, [0, 0.12, 1.14]);
    add(new THREE.TorusGeometry(0.21, 0.045, 8, 18), steel, [0, 0.12, 1.46]);
    add(new THREE.SphereGeometry(0.12, 12, 10), steel, [0, 0.12, 1.45]);
  }
  if (id === 'laser') {
    add(new THREE.BoxGeometry(0.72, 0.14, 0.46), dark, [0, 0.15, 0.78]);
    for (const side of [-1, 1]) {
      const blade = add(new THREE.OctahedronGeometry(0.28), accent, [side * 0.34, 0.25, 1.18], [0.2, 0, side * 0.22]);
      blade.scale.set(0.7, 0.72, 1.65);
      forward(new THREE.ConeGeometry(0.105, 0.25, 6), steel, [side * 0.34, 0.25, 1.43]);
    }
  }
  if (id === 'machine') {
    add(new THREE.BoxGeometry(0.68, 0.34, 0.54), dark, [0, 0.1, 0.82]);
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
    forward(new THREE.CylinderGeometry(0.22, 0.3, 0.82, 12), dark, [0, 0.15, 1.12]);
    add(new THREE.TorusGeometry(0.24, 0.07, 8, 16), accent, [0, 0.15, 1.54]);
    forward(new THREE.CylinderGeometry(0.16, 0.16, 0.06, 12), dark, [0, 0.15, 1.54]);
    add(new THREE.BoxGeometry(0.36, 0.14, 0.28), steel, [0, -0.12, 0.78]);
  }
  if (id === 'spider') {
    add(new THREE.SphereGeometry(0.31, 16, 12), accent, [0, 0.12, 1.1]);
    add(new THREE.SphereGeometry(0.21, 14, 10), dark, [0, 0.12, 1.48]);
    for (const side of [-1, 1]) add(new THREE.SphereGeometry(0.055, 8, 8), steel, [side * 0.1, 0.23, 1.65]);
    for (let legIndex = 0; legIndex < 8; legIndex++) {
      const angle = legIndex / 8 * Math.PI * 2;
      const sx = Math.cos(angle), sz = Math.sin(angle);
      const leg = add(new THREE.ConeGeometry(0.075, 0.64, 6), dark,
        [sx * 1.18, 0.08, sz * 1.18], [sz * 0.56, 0, -sx * 0.66]);
      leg.name = 'spider-leg';
      leg.userData.phase = legIndex * Math.PI / 4;
      leg.userData.restRotation = { x: leg.rotation.x, y: leg.rotation.y, z: leg.rotation.z };
    }
  }
  if (id === 'axe') {
    const start = new THREE.Vector3(0.19, 0.14, 0.98);
    const end = new THREE.Vector3(0.56, 0.14, 1.86);
    addCylinderBetween(group, start, end, 0.078, 0.105, wood, 12);
    const direction = end.clone().sub(start).normalize();
    const haftAxis = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
    for (const t of [0.12, 0.2, 0.28]) {
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.086, 0.086, 0.038, 10), dark);
      band.position.copy(start).lerp(end, t); band.quaternion.copy(haftAxis); band.castShadow = true; group.add(band);
    }
    const blade = new THREE.Group();
    blade.position.copy(end);
    blade.rotation.set(Math.PI / 2, Math.atan2(direction.x, direction.z), 0);
    group.add(blade);

    const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.2, 12), steel);
    socket.position.copy(end).addScaledVector(direction, -0.06);
    socket.quaternion.copy(haftAxis); socket.castShadow = true; group.add(socket);

    const shadow = new THREE.Mesh(makeAxeHeadGeometry(), dark);
    shadow.scale.set(1.06, 1.06, 1);
    shadow.position.z = 0.035;
    shadow.castShadow = true; blade.add(shadow);
    const head = new THREE.Mesh(makeAxeHeadGeometry(), steel);
    head.castShadow = true; head.receiveShadow = true; blade.add(head);

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
    add(new THREE.SphereGeometry(0.09, 12, 10), dark, [start.x, start.y, start.z]);
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
  private webVisuals: THREE.Group[] = [];
  private fxClock = 0;
  private axeAngles = [0, 0, 0, 0];
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

    Array.from({length:4},(_,index)=>BASIC_BALLS[index%2]).forEach((def, index) => {
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
    });
    for (let i = 0; i < 4; i++) {
      const beam = makeEnergyStrip(); beam.group.visible = false; this.scene.add(beam.group); this.beamStrips.push(beam);
    }
    for (let i = 0; i < 10; i++) {
      const laser = makeEnergyStrip(); laser.group.visible = false; this.scene.add(laser.group); this.laserStrips.push(laser);
      const web = makeWebVisual(); web.visible = false; this.scene.add(web); this.webVisuals.push(web);
    }
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(container);
    this.resize();
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
    this.trails.flat().forEach(t => { t.visible = false; });
    this.flashes.forEach(f => { this.scene.remove(f.mesh); f.mesh.geometry.dispose(); (f.mesh.material as THREE.Material).dispose(); });
    this.flashes = [];
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
    this.projectiles.forEach(({ orb, streak }) => {
      orb.visible = false; streak.visible = false;
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
    const group = this.balls[index];
    if (!group || this.abilityIds[index] === abilityId) return;
    const previous = this.abilityGroups[index];
    if (previous) {
      group.remove(previous);
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
    group.add(signature);
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

  afterStep(w: World) {
    for (const event of w.events.filter(e => e.type === 'damage' && e.amount).slice(0, this.lowEffects ? 2 : 5))
      this.showDamageBubble(event.x, event.y, event.amount!);
    if (this.reducedMotion.matches) return;
    for (const event of w.events.filter(e => e.type === 'power' || e.type === 'shot').slice(0, this.lowEffects ? 2 : 5)) {
      const maxSparks = this.lowEffects ? 10 : 28;
      const count = event.type === 'shot' ? 3 : 5;
      for (let i = 0; i < count && this.powerSparks.length < maxSparks; i++) {
        const angle = this.fxClock * 0.45 + i / count * Math.PI * 2;
        const speed = 1.8 + (i % 3) * 0.42;
        const life = 0.32 + (i % 2) * 0.1;
        const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.13 + (i % 2) * 0.035, 0),
          new THREE.MeshBasicMaterial({ color: event.color ?? 0xf1f6cb, transparent: true, opacity: 0.95, depthWrite: false }));
        mesh.position.set(event.x + Math.cos(angle) * 0.25, 0.38 + (i % 2) * 0.12, event.y + Math.sin(angle) * 0.25);
        mesh.rotation.set(angle, angle * 0.6, 0);
        this.scene.add(mesh);
        this.powerSparks.push({ mesh, life, maxLife: life, vx: Math.cos(angle) * speed, vz: Math.sin(angle) * speed, spin: 5 + i });
      }
    }
    for (const event of w.events.filter(e => e.type === 'hit' || e.type === 'beam').slice(0, this.lowEffects ? 2 : 5)) {
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
    if (moving) this.fxClock += delta;
    const effectDelta = moving || w.phase === 'finished' ? delta : 0;
    w.balls.forEach((b, i) => {
      const p = this.previous[i] ?? b;
      const x = THREE.MathUtils.lerp(p.x, b.x, alpha), y = THREE.MathUtils.lerp(p.y, b.y, alpha);
      const group = this.balls[i]; group.position.set(x, b.radius + 0.04, y);
      group.scale.setScalar(b.hp <= 0 ? 0.35 : b.radius / BASIC_BALLS[i%2].radius);
      const signature = this.abilityGroups[i];
      if (signature) {
        signature.position.set(0, 0, 0);
        signature.rotation.set(0, 0, 0);
        const enemies = w.balls.filter(candidate => candidate.hp > 0 && candidate.team !== b.team)
          .sort((a, other) => Math.hypot(a.x - b.x, a.y - b.y) - Math.hypot(other.x - b.x, other.y - b.y));
        const target = enemies[0];
        if (target && ['beam', 'machine', 'cannon', 'orange', 'steel'].includes(b.abilityId ?? ''))
          signature.rotation.y = Math.atan2(target.x - x, target.y - y);
        if (!this.reducedMotion.matches) {
          const spinRate: Record<string, number> = {
            amber: 0.7, jade: 0.52, violet: 0.9, gold: 1.35, cyan: 0.72, pink: 0.9, laser: 0.85,
          };
          if (b.abilityId === 'axe') {
            const lostHp = Math.max(0, 1 - b.hp / b.maxHp);
            this.axeAngles[i] += effectDelta * (4 + lostHp * 7.5);
            signature.rotation.y = this.axeAngles[i];
          } else if (spinRate[b.abilityId ?? '']) signature.rotation.y = this.fxClock * spinRate[b.abilityId ?? ''];
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
          const rotors = signature.userData.rotors as THREE.Group[] | undefined;
          rotors?.forEach(rotor => { rotor.rotation.y = this.fxClock * 18 + (rotor.userData.phase as number); });
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
    });
    this.balls.forEach((group,i)=>{group.visible=i<w.balls.length;this.trails[i].forEach(p=>{if(i>=w.balls.length)p.visible=false;});});
    this.flashes = this.flashes.filter(f => {
      f.life -= effectDelta;
      if (f.mesh.geometry instanceof THREE.RingGeometry) f.mesh.scale.addScalar(effectDelta * 5);
      (f.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, f.life * 2);
      if (f.life > 0) return true;
      this.scene.remove(f.mesh); f.mesh.geometry.dispose(); (f.mesh.material as THREE.Material).dispose(); return false;
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
      const streak = new THREE.Mesh(new THREE.BoxGeometry(1, 0.055, 0.055),
        new THREE.MeshBasicMaterial({ color: 0xff9566, transparent: true, opacity: 0.72 }));
      this.scene.add(orb, streak); this.projectiles.push({ orb, streak });
    }
    this.projectiles.forEach(({ orb, streak }, i) => {
      const shot = w.projectiles[i];
      orb.visible = !!shot; streak.visible = !!shot && !this.lowEffects && !this.reducedMotion.matches;
      if (shot) {
        const radius = shot.radius ?? 0.22;
        orb.position.set(shot.x, 0.35, shot.y); orb.scale.setScalar(radius);
        (orb.material as THREE.MeshBasicMaterial).color.set(shot.color ?? '#ff9566');
        const speed = Math.hypot(shot.vx, shot.vy) || 1;
        streak.position.set(shot.x - shot.vx / speed * 0.34, 0.35, shot.y - shot.vy / speed * 0.34);
        streak.rotation.y = -Math.atan2(shot.vy, shot.vx);
        streak.scale.set(Math.max(0.55, Math.min(1.25, speed * 0.045)), 1, 1);
        (streak.material as THREE.MeshBasicMaterial).color.set(shot.color ?? '#ff9566');
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
    this.laserStrips.forEach((strip, i) => {
      const laser = w.lasers[i];
      strip.group.visible = !!laser;
      if (!laser) return;
      const fade = Math.min(1, laser.ttl / 60);
      strip.group.position.set(laser.axis === 'x' ? 0 : laser.at, 0.16, laser.axis === 'x' ? laser.at : 0);
      strip.group.rotation.y = laser.axis === 'x' ? 0 : Math.PI / 2;
      strip.group.scale.set(20, 1, 1);
      strip.marker.position.x = ((this.fxClock * 0.72 + i * 0.23) % 1 - 0.5) * 0.9;
      updateStrip(strip, laser.color, 0.9 * fade);
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
      const length = Math.hypot(dx, dz);
      strip.group.position.set((ball.x + enemy.x) / 2, 0.72, (ball.y + enemy.y) / 2);
      strip.group.rotation.y = -Math.atan2(dz, dx);
      strip.group.scale.set(length, 1, 1);
      strip.marker.position.x = ((this.fxClock * 2.1 + i * 0.31) % 1 - 0.5) * 0.9;
      updateStrip(strip, '#48eaff', 0.96);
    });
    this.renderer.render(this.scene, this.camera);
  }
}
