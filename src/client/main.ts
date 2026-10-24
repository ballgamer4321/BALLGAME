import './style.css';
import { Arena } from './arena';
import { BASIC_BALLS, MATCH_BALLS, RULES } from '../shared/config';
import { createWorld, stepWorld } from '../simulation/world';
import { connectRooms } from './network';
import { GameAudio } from './audio';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <header class="header">
    <a class="brand" href="./" aria-label="Orbita — strona główna"><span class="brand-symbol">◉</span> ORBITA<span class="brand-sub">STARCIE</span></a>
    <div class="mode"><span></span> WYBIERZ TRYB</div>
    <button id="exit-match" class="exit-match" type="button" hidden>← Zmień tryb</button>
    <span class="build-label">WERSJA / 07</span>
  </header>
  <main>
    <div class="layout">
      <section class="battle" aria-label="Pojedynek">
        <div class="scoreboard">
          ${BASIC_BALLS.map((b, i) => `<div class="fighter fighter-${i}"><div class="fighter-icon">${i ? '◇' : '◈'}</div><div class="fighter-info"><div class="fighter-heading"><span>${b.name}</span><span id="hp-${i}" class="hp">100 <small>/ 100</small></span></div><div class="health-track" role="progressbar" aria-label="HP: ${b.name}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100" id="health-${i}"><div id="bar-${i}"></div></div><span class="fighter-type">KULKA PODSTAWOWA ${String(i + 1).padStart(2, '0')}</span></div></div>`).join('<span class="versus">VS</span>')}
        </div>
        <div class="viewport">
          <div class="arena-label"><span class="live-dot"></span><span id="phase-label">GOTOWOŚĆ</span><span class="arena-number">ARENA 01</span></div>
          <div id="scene"></div>
          <div id="home-overlay" class="home-overlay"><div class="home-shell"><div class="home-heading"><span class="eyebrow">ORBITA / STARCIE</span><h1 id="home-title">Wybierz tryb gry<span>.</span></h1><p id="home-subtitle">Wybierz kulkę, ustaw kierunek i patrz, jak walczy.</p></div><div class="home-content"><section id="local-panel" class="local-panel" data-side="local" hidden><button id="local-back" class="back-button" type="button">← Wróć do trybów</button><span class="eyebrow">TRENING LOKALNY</span><h2>Przygotuj pojedynek</h2><span id="status" class="status">Gotowe</span><p id="hint" class="hint">Wybierz kulki i kierunek startowy.</p><div id="local-aim" class="aim-picker"><div class="local-side-tabs" role="group" aria-label="Wybierz stronę"><button type="button" data-side="local" aria-pressed="true">Twoja kulka</button><button type="button" data-side="rival" aria-pressed="false">Rywal</button></div><div class="local-choice-pair"><div><label for="local-ball">Twoja kulka</label><select id="local-ball">${MATCH_BALLS.map(b => `<option value="${b.id}">${b.name} · ${b.ability}</option>`).join('')}</select></div><div><label for="rival-ball">Rywal</label><select id="rival-ball">${MATCH_BALLS.map(b => `<option value="${b.id}" ${b.id === 'jade' ? 'selected' : ''}>${b.name} · ${b.ability}</option>`).join('')}</select></div></div><label for="local-angle">Kierunek twojej kulki <output id="local-angle-value">0°</output></label><input id="local-angle" type="range" min="-180" max="180" value="0"><p>Walka zacznie się po kliknięciu przycisku. Podczas walki kulki poruszają się same.</p></div><button id="start" class="primary">Rozpocznij pojedynek <span>↗</span></button></section></div></div></div>
          <div class="floor-label">ORBITA <span> / </span> COLLISION LAB</div>
          <div id="result" class="result" hidden role="status"><span class="eyebrow">POJEDYNEK ZAKOŃCZONY</span><h2 id="result-title"></h2><p id="result-detail"></p><button id="replay" class="primary">Przygotuj kolejny pojedynek <span>↗</span></button></div>
        </div>
        <div class="arena-footer"><span><i></i> KWADRATOWA ARENA <b>20 × 20</b></span><span>ZDERZENIA <b id="hits">0</b></span><span>UKŁAD <b id="seed">#0001</b></span><div class="secondary-controls"><button id="pause" disabled>Ⅱ Pauza</button><button id="speed" aria-label="Zmień szybkość podglądu">Tempo 1×</button><button id="sound" type="button" aria-label="Wycisz dźwięk">♪ Dźwięk</button><button id="effects" type="button" aria-label="Przełącz jakość efektów">✦ Efekty</button></div></div>
      </section>
    </div>
  </main>`;

const get = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
let seed = 1;
let localPicks: [string, string] = ['amber', 'jade'];
let world = createWorld(seed, localPicks);
let running = false, paused = false, speed = 1, accumulator = 0;
let online = false;
let localAngle = 0;
let onlineAim: { setAngle: (angle: number) => void; canAim: () => boolean; showMenu: () => void; leave: () => void } | undefined;
let snapshotTime = 0;
let lastNetworkPhase = '';
const audio = new GameAudio();
let lowEffects = localStorage.getItem('orbita-effects') === 'low' || (localStorage.getItem('orbita-effects') !== 'high' && (matchMedia('(pointer: coarse)').matches || innerWidth <= 620));
let arena: Arena;
try {
  arena = new Arena(get('scene'));
  arena.setLowEffects(lowEffects);
  arena.reset(world);
  arena.setAimPreview(world, 0, localAngle);
} catch (error) {
  get('scene').innerHTML = '<p class="graphics-error">Nie udało się uruchomić grafiki 3D. Włącz WebGL lub użyj przeglądarki z akceleracją sprzętową.</p>';
  get<HTMLButtonElement>('start').disabled = true;
  throw error;
}
const soundButton = get<HTMLButtonElement>('sound');
const effectsButton = get<HTMLButtonElement>('effects');
function updateOptions() {
  soundButton.textContent = audio.enabled ? '♪ Dźwięk' : '♪ Cisza';
  soundButton.setAttribute('aria-pressed', String(audio.enabled));
  soundButton.setAttribute('aria-label', audio.enabled ? 'Wycisz dźwięk' : 'Włącz dźwięk');
  effectsButton.textContent = lowEffects ? '✦ Lekkie' : '✦ Pełne';
  effectsButton.setAttribute('aria-pressed', String(!lowEffects));
  effectsButton.setAttribute('aria-label', lowEffects ? 'Włącz pełne efekty' : 'Włącz lekkie efekty');
}
updateOptions();
document.addEventListener('pointerdown', () => audio.unlock(), { once: true });
document.addEventListener('keydown', () => audio.unlock(), { once: true });
soundButton.addEventListener('click', () => { audio.toggle(); updateOptions(); });
effectsButton.addEventListener('click', () => {
  lowEffects = !lowEffects;
  localStorage.setItem('orbita-effects', lowEffects ? 'low' : 'high');
  arena.setLowEffects(lowEffects);
  updateOptions();
});

function updateHud() {
  world.balls.forEach((b, i) => {
    const def = MATCH_BALLS.find(candidate => candidate.id === b.abilityId);
    if (def) arena.setBallColor(i, def.color);
  });
  for(let team=0;team<2;team++){
    const members=world.balls.filter(b=>b.team===team);
    const hp=Math.ceil(members.reduce((sum,b)=>sum+b.hp,0));
    const maxHp=members.reduce((sum,b)=>sum+b.maxHp,0);
    const names=members.map(b=>MATCH_BALLS.find(def=>def.id===b.abilityId)?.name??b.id);
    document.querySelectorAll<HTMLElement>('.fighter-heading > span:first-child')[team].textContent=names.join(' + ');
    document.querySelectorAll<HTMLElement>('.fighter-type')[team].textContent=members.length>1?`DRUŻYNA ${team+1} · ${members.length} KULKI`:(MATCH_BALLS.find(def=>def.id===members[0]?.abilityId)?.ability??'KULKA PODSTAWOWA');
    get(`hp-${team}`).innerHTML=`${hp} <small>/ ${maxHp}</small>`;
    get(`bar-${team}`).style.width=`${maxHp?hp/maxHp*100:0}%`;
    get(`health-${team}`).setAttribute('aria-valuenow',String(hp));
    get(`health-${team}`).setAttribute('aria-valuemax',String(maxHp));
    get(`health-${team}`).setAttribute('aria-label',`HP drużyny ${team+1}`);
  }
  get('hits').textContent = String(world.hits);
  get('seed').textContent = `#${String(seed).padStart(4, '0')}`;
}
updateHud();

for(const id of ['local-ball','rival-ball'] as const){
  const select=get<HTMLSelectElement>(id);
  const cards=document.createElement('div');cards.className='ball-card-grid';cards.setAttribute('role','group');cards.setAttribute('aria-label',id==='local-ball'?'Wybierz swoją kulkę':'Wybierz kulkę rywala');
  for(const def of MATCH_BALLS){
    const button=document.createElement('button');button.type='button';button.className='ball-card';button.dataset.ball=def.id;
    button.innerHTML=`<span class="ball-card-orb" style="--orb:${def.color}"></span><strong>${def.name}</strong><small>${def.trigger.toUpperCase()} · ${def.hp} HP</small><span class="ball-card-ability">${def.ability}</span>`;
    button.onclick=()=>{select.value=def.id;select.dispatchEvent(new Event('change'));syncCards();};cards.append(button);
  }
  select.after(cards);
}
function syncCards(){for(const id of ['local-ball','rival-ball']){const select=get<HTMLSelectElement>(id);select.parentElement!.querySelectorAll<HTMLButtonElement>(`.ball-card-grid[aria-label="${id==='local-ball'?'Wybierz swoją kulkę':'Wybierz kulkę rywala'}"] .ball-card`).forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.ball===select.value)));}}
syncCards();
document.querySelectorAll<HTMLButtonElement>('.local-side-tabs button').forEach(button => button.addEventListener('click', () => {
  get('local-panel').dataset.side = button.dataset.side;
  document.querySelectorAll<HTMLButtonElement>('.local-side-tabs button').forEach(tab => tab.setAttribute('aria-pressed', String(tab === button)));
}));

function start() {
  if (online) return;
  world = createWorld(seed, localPicks, [localAngle, Math.PI]); accumulator = 0;
  arena.reset(world); running = true; paused = false;
  audio.resetRound(); audio.play('start');
  arena.clearAimPreview();
  get('home-overlay').hidden = true;
  get('exit-match').hidden = false;
  get('local-aim').hidden = true;
  get('result').hidden = true;
  get('phase-label').textContent = 'WALKA W TOKU';
  get('status').textContent = 'Walka';
  get('hint').textContent = 'Obserwuj trajektorie i automatyczne aktywacje mocy. Trafienia zależą od wybranej kulki.';
  get<HTMLButtonElement>('pause').disabled = false;
  get('pause').textContent = 'Ⅱ Pauza';
  get<HTMLButtonElement>('start').disabled = true;
  get('start').innerHTML = 'Pojedynek w toku <span>●</span>';
  updateHud();
}

function prepareNext() {
  if (online) return;
  seed++;
  world = createWorld(seed, localPicks, [localAngle, Math.PI]);
  accumulator = 0; running = false; paused = false;
  arena.reset(world);
  arena.setAimPreview(world, 0, localAngle);
  get('home-overlay').hidden = false;
  get('exit-match').hidden = true;
  get('local-panel').hidden = false;
  get('result').hidden = true;
  get('local-aim').hidden = false;
  get('phase-label').textContent = 'GOTOWOŚĆ';
  get('status').textContent = 'Gotowe';
  get('hint').textContent = 'Ustaw kierunek na arenie lub suwakiem, a potem rozpocznij pojedynek.';
  get<HTMLButtonElement>('start').disabled = false;
  get('start').innerHTML = 'Rozpocznij pojedynek <span>↗</span>';
  updateHud();
}

function togglePause() {
  if (online) return;
  if (!running) return;
  paused = !paused; accumulator = 0;
  get('pause').textContent = paused ? '▷ Wznów' : 'Ⅱ Pauza';
  get('status').textContent = paused ? 'Pauza' : 'Walka';
  get('phase-label').textContent = paused ? 'PAUZA' : 'WALKA W TOKU';
}

get('start').addEventListener('click', () => world.phase === 'finished' ? prepareNext() : start());
get('replay').addEventListener('click', prepareNext);
get('exit-match').addEventListener('click', () => online ? onlineAim?.leave() : location.reload());
get('pause').addEventListener('click', togglePause);
get('speed').addEventListener('click', () => {
  speed = speed === 1 ? 3 : 1;
  get('speed').textContent = `Tempo ${speed}×`;
});
get('local-back').addEventListener('click', () => {
  get('local-panel').hidden = true;
  get('local-aim').hidden = false;
  get('result').hidden = true;
  document.querySelector('.mode')!.textContent = 'WYBIERZ TRYB';
  get('home-title').innerHTML='Wybierz tryb gry<span>.</span>';
  get('home-subtitle').textContent='Wybierz kulkę, ustaw kierunek i patrz, jak walczy.';
  onlineAim?.showMenu();
});
for (const [id, slot] of [['local-ball', 0], ['rival-ball', 1]] as const) {
  get<HTMLSelectElement>(id).addEventListener('change', event => {
    localPicks[slot] = (event.target as HTMLSelectElement).value;
    if (online || running) return;
    world = createWorld(seed, localPicks);
    arena.reset(world); arena.setAimPreview(world, 0, localAngle); updateHud();
    get('result').hidden = true;
    get('phase-label').textContent = 'GOTOWOŚĆ';
    get('status').textContent = 'Gotowe';
  });
}
get<HTMLInputElement>('local-angle').addEventListener('input', event => {
  localAngle = Number((event.target as HTMLInputElement).value) * Math.PI / 180;
  get('local-angle-value').textContent = `${Math.round(localAngle * 180 / Math.PI)}°`;
  if (!online && !running) arena.setAimPreview(world, 0, localAngle);
});
const sceneElement = get('scene');
let aimingPointer: number | null = null;
const canPointAim = () => online ? (lastNetworkPhase === 'select' || lastNetworkPhase === 'aim') && !!onlineAim?.canAim() : !running && world.phase === 'running';
function updatePointAim(event: PointerEvent) {
  if (!canPointAim()) return;
  const slot = online ? Number(sceneElement.dataset.aimSlot ?? 0) : 0;
  const angle = arena.angleFromPointer(event, world.balls[slot]);
  if (angle === null) return;
  if (online) onlineAim?.setAngle(angle);
  else {
    localAngle = angle;
    get<HTMLInputElement>('local-angle').value = String(Math.round(angle * 180 / Math.PI));
    get('local-angle-value').textContent = `${Math.round(angle * 180 / Math.PI)}°`;
    arena.setAimPreview(world, 0, angle);
  }
}
sceneElement.addEventListener('pointerdown', event => {
  if (!canPointAim()) return;
  aimingPointer = event.pointerId;
  sceneElement.setPointerCapture(event.pointerId);
  sceneElement.classList.add('is-aiming');
  updatePointAim(event);
});
sceneElement.addEventListener('pointermove', event => {
  if (aimingPointer === event.pointerId) updatePointAim(event);
});
const stopPointAim = (event: PointerEvent) => {
  if (aimingPointer !== event.pointerId) return;
  aimingPointer = null;
  sceneElement.classList.remove('is-aiming');
  if (sceneElement.hasPointerCapture(event.pointerId)) sceneElement.releasePointerCapture(event.pointerId);
};
sceneElement.addEventListener('pointerup', stopPointAim);
sceneElement.addEventListener('pointercancel', stopPointAim);
document.addEventListener('visibilitychange', () => { if (document.hidden && running && !paused) togglePause(); });

function finish() {
  running = false;
  audio.play('result');
  get('result').hidden = false;
  const winningBall=world.balls.find(b=>b.id===world.winner);
  const winner = MATCH_BALLS.find(b => b.id === world.winner?.split(':').at(-1));
  get('result-title').textContent = world.balls.length>2 && winningBall ? `Drużyna ${winningBall.team+1} wygrywa` : winner ? `${winner.name} wygrywa` : 'Równe siły. Remis.';
  get('result-detail').textContent = `${world.reason === 'timeout' ? 'Arena przerwała zablokowaną walkę' : 'Koniec zdrowia'} · ${world.hits} zderzeń`;
  get('phase-label').textContent = 'KONIEC POJEDYNKU'; get('status').textContent = 'Wynik';
  get('hint').textContent = online ? 'Wynik rundy jest ustalany przez serwer. Kolejna runda zacznie się automatycznie.' : 'Przygotuj kolejny pojedynek, aby ponownie wybrać kulki i kierunek.';
  get<HTMLButtonElement>('pause').disabled = true;
  get<HTMLButtonElement>('start').disabled = false;
  get('start').innerHTML = 'Przygotuj kolejny pojedynek <span>↗</span>';
  get('replay').focus({ preventScroll: true });
}

let last = performance.now();
function frame(now: number) {
  const delta = Math.min((now - last) / 1000, 0.1); last = now;
  if (running && !paused && !online) {
    accumulator += delta * speed;
    while (accumulator >= RULES.step && running) {
      arena.beforeStep(world); stepWorld(world); arena.afterStep(world); audio.playEvents(world.events, world.tick);
      accumulator -= RULES.step;
      if (world.phase === 'finished') finish();
    }
    updateHud();
    if (running && world.tick > RULES.overtimeTick) {
      get('status').textContent = 'Dogrywka';
      get('hint').textContent = 'Arena kończy przeciągającą się walkę, stopniowo odbierając zdrowie obu kulkom.';
    }
  }
  arena.render(world, online ? Math.min(1, (now - snapshotTime) / 50) : running && !paused ? accumulator / RULES.step : 1, delta, running && !paused);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
onlineAim = connectRooms(state => {
  if (state.phase === 'fight' && lastNetworkPhase !== 'fight') { audio.resetRound(); audio.play('start'); }
  online = true;
  get('home-overlay').hidden = !['lobby','abandoned','match_result'].includes(state.phase);
  get('exit-match').hidden = !['select','aim','fight','round_result'].includes(state.phase);
  get('local-panel').hidden = true;
  if(state.phase==='lobby'){
    get('home-title').textContent=`Pokój ${state.code}`;
    get('home-subtitle').textContent=state.mode==='bot'?'Trening z botem. Potwierdź gotowość, żeby wybrać kulkę.':'Zaproś graczy kodem lub linkiem i potwierdź gotowość.';
  }else if(state.phase==='match_result'){
    get('home-title').textContent='Koniec meczu';
    get('home-subtitle').textContent='Możecie zagrać rewanż lub wrócić do menu.';
  }
  get('local-aim').hidden = true;
  get<HTMLButtonElement>('start').disabled = true;
  get<HTMLButtonElement>('pause').disabled = true;
  get<HTMLButtonElement>('speed').disabled = true;
  get('replay').hidden = true;
  document.querySelector('.mode')!.textContent = state.mode === 'bot' ? 'TRENING Z BOTEM' : `MULTIPLAYER ${state.mode}`;
  get('phase-label').textContent = state.phase === 'fight' ? 'WALKA SIECIOWA' : state.phase === 'abandoned' ? 'GRACZ OPUŚCIŁ POKÓJ' : state.mode === 'bot' ? 'TRENING Z BOTEM' : `POKÓJ ${state.mode.toUpperCase()}`;
  if (!state.world) {
    running = false;
    if (lastNetworkPhase !== state.phase) {
      world = createWorld(1,Array.from({length:state.mode==='2v2'?4:2},(_,i)=>i%2?'jade':'amber')); arena.reset(world); updateHud();
      get('status').textContent = state.phase === 'select' ? 'Wybór' : state.phase === 'aim' ? 'Kierunek' : 'Pokój';
      get('hint').textContent = state.phase === 'select' ? 'Wybierz jedną z trzech kulek albo użyj wyboru z kolekcji.' : state.phase === 'aim' ? 'Ustaw kierunek startowy i zatwierdź go przed walką.' : 'Czekam na graczy.';
    }
    const enteringAim = (state.phase === 'select' || state.phase === 'aim') && lastNetworkPhase !== state.phase;
    lastNetworkPhase = state.phase;
    get('scene').dataset.aimSlot = String(state.slot);
    if ((state.phase !== 'select' && state.phase !== 'aim') || state.angleLocked) arena.clearAimPreview();
    else if (enteringAim) arena.setAimPreview(world, state.slot, (state.slot % 2 === 0 ? 0 : Math.PI));
    get('result').hidden = true;
    if(state.phase==='match_result'){
      get('result-title').textContent=state.score[0]===state.score[1]?'Mecz zakończony remisem':`${state.mode==='2v2'?'Drużyna':'Gracz'} ${state.score[0]>state.score[1]?1:2} wygrywa walkowerem`;
      get('status').textContent='Koniec meczu';get('hint').textContent='Czas na powrót przeciwnika minął.';
    }
    get('phase-label').textContent = state.phase === 'select' ? 'WYBÓR KULKI' : state.phase === 'aim' ? 'KIERUNEK STARTOWY' : state.mode==='bot'?'TRENING Z BOTEM':`POKÓJ ${state.mode.toUpperCase()}`; return;
  }
  lastNetworkPhase = state.phase;
  arena.clearAimPreview();
  arena.beforeStep(world);
  world = { ...state.world, contacts: new Set(), collisionLimitHits: 0 };
  arena.afterStep(world);
  audio.playEvents(world.events, world.tick);
  world.balls.forEach((ball,i) => {
    const def = MATCH_BALLS.find(b => b.id === ball.id.split(':').at(-1));
    const label = document.querySelectorAll<HTMLElement>('.fighter-heading > span:first-child')[i];
    if (def && label) label.textContent = def.name;
    if (def) arena.setBallColor(i, def.color);
  });
  seed = world.seed; snapshotTime = performance.now();
  running = state.phase === 'fight'; paused = false;
  updateHud();
  if(state.phase==='fight'){get('status').textContent='Walka';get('hint').textContent=state.mode==='2v2'?'Cztery kulki walczą w dwóch drużynach. Wynik i obrażenia liczy serwer.':'Obserwuj automatyczny pojedynek. Wynik i obrażenia liczy serwer.';}
  if (state.phase === 'round_result' || state.phase === 'match_result') {
    if (get('result').hidden) finish();
    if (state.phase === 'match_result') get('result-title').textContent = state.score[0] === state.score[1] ? 'Mecz zakończony remisem' : `Mecz wygrywa ${state.mode==='2v2'?'drużyna':'gracz'} ${state.score[0] > state.score[1] ? 1 : 2}`;
    if (state.phase === 'match_result') get('result').hidden = true;
    get<HTMLButtonElement>('start').disabled = true;
  }
}, () => location.reload(), (angle, slot) => arena.setAimPreview(world, slot, angle), () => {
  get('exit-match').hidden = true;
  get('local-panel').hidden = false;
  get('home-overlay').hidden = false;
  get('local-aim').hidden = false;
  document.querySelector('.mode')!.textContent = 'TRENING LOKALNY';
});
