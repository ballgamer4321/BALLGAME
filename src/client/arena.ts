import * as THREE from 'three';
import { BASIC_BALLS, MATCH_BALLS, RULES } from '../shared/config';
import { COSMETICS } from '../shared/progression';
import type { World } from '../simulation/world';

interface EnergyStrip { group: THREE.Group; core: THREE.Mesh; glow: THREE.Mesh; }
interface ProjectileVisual { orb: THREE.Mesh; streak: THREE.Mesh; }

function makeEnergyStrip(): EnergyStrip {
  const group = new THREE.Group();
  const core = new THREE.Mesh(new THREE.BoxGeometry(1, 0.055, 0.11),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.96 }));
  const glow = new THREE.Mesh(new THREE.BoxGeometry(1, 0.2, 0.42),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.32, depthWrite: false }));
  group.add(glow, core);
  return { group, core, glow };
}

function makeBallSignature(id: string, color: string) {
  const group = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color, metalness: 0.72, roughness: 0.26 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x253039, metalness: 0.82, roughness: 0.3 });
  const add = (geometry: THREE.BufferGeometry, material: THREE.Material, position: [number, number, number], rotation: [number, number, number] = [0, 0, 0]) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position); mesh.rotation.set(...rotation); mesh.castShadow = true; group.add(mesh);
  };
  if (id === 'beam') add(new THREE.CylinderGeometry(0.2, 0.3, 0.58, 10), metal, [0, 0.12, 0.93], [Math.PI / 2, 0, 0]);
  if (id === 'laser') {
    add(new THREE.ConeGeometry(0.15, 0.58, 6), metal, [-0.38, 0.55, 0.68], [0.2, 0, -0.42]);
    add(new THREE.ConeGeometry(0.15, 0.58, 6), metal, [0.38, 0.55, 0.68], [0.2, 0, 0.42]);
  }
  if (id === 'machine') for (const x of [-0.23, 0.23]) {
    add(new THREE.CylinderGeometry(0.09, 0.12, 0.64, 8), dark, [x, 0.08, 0.88], [Math.PI / 2, 0, 0]);
    add(new THREE.CylinderGeometry(0.11, 0.11, 0.08, 8), metal, [x, 0.08, 1.19], [Math.PI / 2, 0, 0]);
  }
  if (id === 'cannon') {
    add(new THREE.CylinderGeometry(0.23, 0.3, 0.7, 10), dark, [0, 0.16, 0.83], [Math.PI / 2, 0, 0]);
    add(new THREE.CylinderGeometry(0.28, 0.28, 0.12, 10), metal, [0, 0.16, 1.13], [Math.PI / 2, 0, 0]);
  }
  if (id === 'spider') for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    add(new THREE.ConeGeometry(0.09, 0.72, 6), dark, [sx * 0.68, 0.1, sz * 0.54], [sz * 0.56, 0, -sx * 0.64]);
  }
  if (id === 'axe') {
    add(new THREE.CylinderGeometry(0.055, 0.08, 0.76, 7), dark, [0.6, 0.34, 0.42], [0, 0, -0.55]);
    add(new THREE.OctahedronGeometry(0.4, 0), metal, [0.77, 0.67, 0.55], [0, 0, -0.35]);
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
        if (object instanceof THREE.Mesh) {
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
    for (const event of w.events.filter(e => e.type === 'hit' || e.type === 'power' || e.type === 'beam' || e.type === 'shot').slice(0, this.lowEffects ? 2 : 5)) {
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
    this.fxClock += delta;
    w.balls.forEach((b, i) => {
      const p = this.previous[i] ?? b;
      const x = THREE.MathUtils.lerp(p.x, b.x, alpha), y = THREE.MathUtils.lerp(p.y, b.y, alpha);
      const group = this.balls[i]; group.position.set(x, b.radius + 0.04, y);
      group.scale.setScalar(b.hp <= 0 ? 0.35 : b.radius / BASIC_BALLS[i%2].radius);
      const satellite = group.children[1] as THREE.Mesh;
      satellite.visible = b.echoUntil > w.tick;
      if (satellite.visible && !this.reducedMotion.matches) satellite.position.set(Math.cos(w.tick * 0.18) * b.radius * 1.5, 0.2, Math.sin(w.tick * 0.18) * b.radius * 1.5);
      const charge = this.chargeCrystals[i];
      charge.visible = b.abilityId === 'beam' && (b.beamChargeUntil > w.tick || b.beamUntil > w.tick);
      if (charge.visible && !this.reducedMotion.matches) {
        charge.rotation.y += delta * 3.6;
        const pulse = 0.86 + Math.sin(this.fxClock * 12) * 0.18;
        charge.scale.setScalar(pulse);
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
      f.life -= delta;
      if (f.mesh.geometry instanceof THREE.RingGeometry) f.mesh.scale.addScalar(delta * 5);
      (f.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, f.life * 2);
      if (f.life > 0) return true;
      this.scene.remove(f.mesh); f.mesh.geometry.dispose(); (f.mesh.material as THREE.Material).dispose(); return false;
    });
    this.damageBubbles = this.damageBubbles.filter(bubble => {
      bubble.life -= delta;
      bubble.sprite.position.y += bubble.rise * delta;
      bubble.sprite.material.opacity = Math.min(1, bubble.life * 2.4);
      const pulse = 1 + Math.max(0, 0.18 - bubble.life) * 0.25;
      bubble.sprite.scale.set(2.5 * pulse, 1.25 * pulse, 1);
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
      (strip.core.material as THREE.MeshBasicMaterial).opacity = opacity;
      (strip.glow.material as THREE.MeshBasicMaterial).opacity = opacity * 0.34;
      strip.glow.visible = !this.lowEffects;
    };
    this.laserStrips.forEach((strip, i) => {
      const laser = w.lasers[i];
      strip.group.visible = !!laser;
      if (!laser) return;
      const pulse = 0.7 + Math.sin(this.fxClock * 14 + i) * 0.2;
      const fade = Math.min(1, laser.ttl / 60);
      strip.group.position.set(laser.axis === 'x' ? 0 : laser.at, 0.16, laser.axis === 'x' ? laser.at : 0);
      strip.group.rotation.y = laser.axis === 'x' ? 0 : Math.PI / 2;
      strip.group.scale.set(20, 1, 1);
      updateStrip(strip, laser.color, pulse * fade);
    });
    this.webVisuals.forEach((webGroup, i) => {
      const web = w.webs[i];
      webGroup.visible = !!web;
      if (!web) return;
      webGroup.position.set(web.x, 0.055, web.y);
      webGroup.scale.setScalar(web.radius);
      webGroup.rotation.y = this.reducedMotion.matches ? 0 : Math.sin(this.fxClock * 1.7 + i) * 0.08;
      const lines = webGroup.children[0] as THREE.LineSegments;
      const material = lines.material as THREE.LineBasicMaterial;
      material.color.set(web.color);
      material.opacity = Math.min(0.78, web.ttl / 360) * (0.76 + Math.sin(this.fxClock * 8 + i) * 0.12);
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
      const pulse = 0.75 + Math.sin(this.fxClock * 25) * 0.22;
      updateStrip(strip, '#48eaff', pulse);
    });
    this.renderer.render(this.scene, this.camera);
  }
}
