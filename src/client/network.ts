import type { Rooms } from '../server/rooms';
import { MATCH_BALLS } from '../shared/config';
type Snapshot = ReturnType<Rooms['snapshot']>;
export function connectRooms(onState: (s: Snapshot) => void, onLeave: () => void, onAimChange: (angle: number, slot: number) => void, onLocalMode: () => void) {
  const panel = document.createElement('section'); panel.className = 'control-panel home-network';
  panel.innerHTML = `<p id="network-status" role="status">Kliknij tryb, aby rozpocząć.</p><div id="mode-options" class="mode-options"><button class="mode-card" data-mode="1v1" type="button"><span class="mode-card-icon">◈</span><strong>1 na 1</strong><small>Wyzwanie dla dwóch graczy</small><span class="mode-card-arrow">↗</span></button><button class="mode-card" data-mode="2v2" type="button"><span class="mode-card-icon">✦</span><strong>2 na 2</strong><small>Dwie drużyny, cztery kulki</small><span class="mode-card-arrow">↗</span></button><button class="mode-card" data-mode="bot" type="button"><span class="mode-card-icon">◇</span><strong>Trening z botem</strong><small>Natychmiastowy pojedynek</small><span class="mode-card-arrow">↗</span></button><button class="mode-card" id="local-mode" type="button"><span class="mode-card-icon">◎</span><strong>Gra lokalna</strong><small>Wybierz obie kulki i testuj moce</small><span class="mode-card-arrow">↗</span></button></div><div id="join-controls" class="join-controls"><label for="room-code">Masz kod pokoju?</label><input id="room-code" maxlength="6" autocomplete="off" placeholder="WPISZ KOD"><button id="join-room" type="button">Dołącz do gry ↗</button></div><div id="room-actions" class="room-actions" hidden><div id="room-roster" class="room-roster"></div><button id="ready-room" class="primary" type="button" hidden>Jestem gotowy <span>↗</span></button><div id="round-controls" hidden><p id="score-line"></p><p id="match-summary" hidden></p><button id="rematch" class="primary" type="button" hidden>Rewanż <span>↗</span></button></div><label id="invite-label" for="room-link" hidden>Link zaproszenia</label><input id="room-link" readonly aria-label="Link zaproszenia" hidden><button id="leave-room" class="back-button" type="button" hidden>← Opuść pokój</button></div>`;
  document.querySelector('.home-content')!.prepend(panel);
  const el = <T extends HTMLElement>(id:string) => panel.querySelector<T>('#'+id)!;
  const viewport = document.querySelector<HTMLElement>('.viewport')!;
  const overlay = document.createElement('section');
  overlay.id='selection-overlay';overlay.className='selection-overlay';overlay.hidden=true;overlay.setAttribute('aria-label','Wybór kulki przed rundą');
  overlay.innerHTML=`<div class="selection-shell"><div class="selection-heading"><span class="eyebrow">PRZYGOTOWANIE RUNDY</span><h2>Wybierz swoją kulkę</h2><p>Trzy losowe propozycje. Raz na mecz możesz otworzyć wszystkie dostępne kulki.</p></div><div id="selection-players" class="selection-players"></div><div id="selection-tabs" class="selection-tabs"><button id="offer-tab" type="button">3 losowe kulki</button><button id="collection-tab" type="button">Moje kulki · raz na mecz</button></div><div id="selection-cards" class="selection-cards" role="group" aria-label="Kulki do wyboru"></div><div id="selection-aim" class="selection-aim"><label for="selection-angle">Kierunek startowy <output id="selection-angle-value">0°</output></label><input id="selection-angle" type="range" min="-180" max="180" value="0"><span>Możesz też wskazać kierunek na arenie.</span></div><div class="selection-bottom"><button id="confirm-selection" class="primary" type="button" disabled>Potwierdź kulkę i kierunek ↗</button><p id="selection-note" role="status">Walka zacznie się, gdy wszyscy gracze wybiorą kulki.</p></div></div>`;
  viewport.append(overlay);
  const pickEl=<T extends HTMLElement>(id:string)=>overlay.querySelector<T>('#'+id)!;
  const code = el<HTMLInputElement>('room-code');
  code.value = new URLSearchParams(location.search).get('room')?.toUpperCase().slice(0,6) || '';
  let socket: WebSocket | undefined;
  const onlineConfigured=!import.meta.env.PROD || !!import.meta.env.VITE_WS_URL?.trim();
  let previousPhase='';
  let currentSlot = 0;
  let canAim = false;
  let leaving = false;
  let sessionToken = sessionStorage.getItem('orbita-room-token');
  const status = el('network-status');
  let currentState:Snapshot|null=null;
  let roundKey='';
  let cardsKey='';
  let selectedId:string|null=null;
  let collectionView=false;
  let choicePending=false;
  let pickerError='';
  const angleInput=pickEl<HTMLInputElement>('selection-angle');
  const confirm=pickEl<HTMLButtonElement>('confirm-selection');
  function setAngleDegrees(degrees:number){
    const value=Math.max(-180,Math.min(180,Math.round(degrees)));
    angleInput.value=String(value);
    pickEl('selection-angle-value').textContent=`${value}°`;
    onAimChange(value*Math.PI/180,currentSlot);
  }
  function renderPicker(){
    const data=currentState;
    const preparing=!!data && (data.phase==='select' || data.phase==='aim');
    overlay.hidden=!preparing;
    viewport.classList.toggle('selection-active',preparing);
    if(!data || !preparing)return;
    const chosen=data.players.filter(player=>player.chosen).length;
    const myChoice=!!data.pick || choicePending;
    const choosing=data.phase==='select'&&!myChoice;
    const aiming=data.phase==='aim'&&!data.angleLocked&&!choicePending;
    pickEl('selection-players').innerHTML=data.players.map((player,i)=>`<div class="selection-player ${player.chosen?'is-chosen':''}"><span>${i===data.slot?'TY':player.bot?'BOT':`GRACZ ${i+1}`} <small>DRUŻYNA ${player.team+1}</small></span><b>${player.chosen?'WYBRANO':'WYBIERA…'}</b></div>`).join('');
    pickEl('selection-tabs').hidden=!choosing;
    pickEl<HTMLButtonElement>('offer-tab').setAttribute('aria-pressed',String(!collectionView));
    const collectionTab=pickEl<HTMLButtonElement>('collection-tab');
    collectionTab.disabled=data.collectionUsed;
    collectionTab.setAttribute('aria-pressed',String(collectionView));
    collectionTab.textContent=data.collectionUsed?'Kolekcja wykorzystana':'Moje kulki · raz na mecz';
    const cards=pickEl('selection-cards');
    const key=`${roundKey}|${choosing}|${collectionView}|${selectedId}|${data.pick}|${choicePending}`;
    if(cardsKey!==key){
      cardsKey=key;cards.replaceChildren();
      if(choosing){
        const ids=collectionView?MATCH_BALLS.map(ball=>ball.id):data.offer;
        for(const id of ids){
          const def=MATCH_BALLS.find(ball=>ball.id===id)!;
          const button=document.createElement('button');button.type='button';button.className='ball-card';
          button.setAttribute('aria-pressed',String(selectedId===id));
          button.innerHTML=`<span class="ball-card-orb" style="--orb:${def.color}"></span><strong>${def.name}</strong><small>${def.trigger.toUpperCase()} · ${def.hp} HP</small><span class="ball-card-ability">${def.ability}</span>`;
          button.onclick=()=>{selectedId=id;pickerError='';renderPicker();};cards.append(button);
        }
      }else{
        const name=MATCH_BALLS.find(ball=>ball.id===data.pick)?.name;
        const wait=document.createElement('p');wait.className='selection-wait';
        wait.textContent=data.phase==='aim'?'Kulki wybrane. Ustaw kierunek.':name?`${name} wybrany. Czekamy na pozostałych graczy…`:'Wybór zapisany. Czekamy na pozostałych graczy…';cards.append(wait);
      }
    }
    cards.hidden=data.phase==='aim';
    pickEl('selection-aim').hidden=!choosing&&!aiming;
    confirm.hidden=!choosing&&!aiming;
    confirm.disabled=choicePending || (choosing&&!selectedId);
    confirm.textContent=data.phase==='aim'?'Potwierdź kierunek ↗':'Potwierdź kulkę i kierunek ↗';
    pickEl('selection-note').textContent=pickerError || (myChoice?`Wybrano ${chosen} z ${data.players.length}. Walka ruszy po decyzji wszystkich.`:'Walka ruszy, gdy wszyscy gracze potwierdzą kulkę i kierunek.');
  }
  function send(action: {type:string;[key:string]:unknown}) {
    if (socket?.readyState === WebSocket.OPEN) { socket.send(JSON.stringify(action)); return; }
    if (socket?.readyState === WebSocket.CONNECTING) return;
    status.textContent = 'Łączenie…';
    const endpoint=import.meta.env.VITE_WS_URL?.trim() || `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws`;
    socket = new WebSocket(endpoint);
    socket.onopen = () => socket!.send(JSON.stringify(action));
    socket.onmessage = event => {
      const data = JSON.parse(event.data);
      if (data.type === 'error') { status.textContent = data.message;pickerError=data.message;choicePending=false;renderPicker(); if(action.type==='resume'){sessionStorage.removeItem('orbita-room-token');sessionToken=null;onLeave();} return; }
      if (data.type === 'session') {sessionToken=data.token;sessionStorage.setItem('orbita-room-token',data.token);return;}
      if (data.type === 'left') {sessionStorage.removeItem('orbita-room-token');sessionToken=null;onLeave();return;}
      if (data.type !== 'state') return;
      currentState=data;
      currentSlot = data.slot;
      const nextRoundKey=`${data.code}:${data.round}`;
      if(data.phase==='select' && (roundKey!==nextRoundKey || previousPhase==='match_result')){
        roundKey=nextRoundKey;selectedId=null;collectionView=false;choicePending=false;pickerError='';cardsKey='';
        setAngleDegrees(data.slot%2===0?0:180);
      }
      if(data.pick || data.phase==='fight')choicePending=false;
      canAim = (data.phase === 'select' && !data.pick && !choicePending) || (data.phase==='aim' && !data.angleLocked && !choicePending);
      const chosen=data.players.filter((player:{chosen:boolean})=>player.chosen).length;
      const seats=data.mode==='2v2'?4:2;
      status.textContent = `Pokój ${data.code} · ${data.mode==='bot'?'trening z botem':data.mode} · ${data.phase==='select'?`wybrano ${chosen}/${seats}`:`gotowi ${data.players.filter((player:{ready:boolean})=>player.ready).length}/${seats}`}`;
      panel.hidden=false;
      el('mode-options').hidden=true;el('join-controls').hidden=true;el('room-actions').hidden=false;
      el('room-roster').innerHTML=Array.from({length:seats},(_,i)=>{
        const player=data.players[i];
        const label=i===data.slot?'TY':player?.bot?'BOT':player?`GRACZ ${i+1}`:'WOLNE MIEJSCE';
        const state=!player?'CZEKAM':!player.connected?'ROZŁĄCZONY':data.phase==='select'?(player.chosen?'WYBRANO':'WYBIERA'):player.ready?'GOTOWY':'NIEGOTOWY';
        return `<div class="roster-player ${player?.ready?'is-ready':''}"><span>${label}<small>DRUŻYNA ${i%2+1}</small></span><b>${state}</b></div>`;
      }).join('');
      el<HTMLButtonElement>('ready-room').hidden = data.phase !== 'lobby';
      el<HTMLButtonElement>('ready-room').disabled = data.players[data.slot]?.ready;
      el<HTMLButtonElement>('ready-room').innerHTML=data.players[data.slot]?.ready?'Czekam na innych…':'Jestem gotowy <span>↗</span>';
      el('leave-room').hidden = false;
      el('round-controls').hidden = data.phase === 'lobby';
      el('score-line').textContent = `Runda ${data.round}/9 · wynik ${data.score[0]} : ${data.score[1]}`;
      el('match-summary').hidden=data.phase!=='match_result';
      if(data.phase==='match_result')el('match-summary').textContent=data.score[0]===data.score[1]?'Mecz zakończony remisem':`Mecz wygrywa ${data.mode==='2v2'?'drużyna':'gracz'} ${data.score[0]>data.score[1]?1:2}`;
      renderPicker();
      el('rematch').hidden = data.phase !== 'match_result' || !data.rematchAvailable;
      const link = el<HTMLInputElement>('room-link'); link.hidden = data.mode === 'bot';
      el('invite-label').hidden=data.mode==='bot';
      const url = new URL(location.href); url.searchParams.set('room', data.code); link.value = url.href;
      onState(data);
      previousPhase=data.phase;
    };
    socket.onclose = () => {status.textContent = 'Połączenie przerwane. Próbuję wrócić do pokoju…';el<HTMLButtonElement>('ready-room').disabled=true;if(!leaving && sessionToken)setTimeout(()=>send({type:'resume',token:sessionToken}),1200);};
    socket.onerror = () => { status.textContent = 'Nie można połączyć się z serwerem gry.'; };
  }
  panel.querySelectorAll<HTMLButtonElement>('.mode-card[data-mode]').forEach(button=>button.onclick=()=>send({type:'create',mode:button.dataset.mode}));
  if(!onlineConfigured){
    status.textContent='Tryby online wymagają serwera gry. Możesz teraz zagrać lokalnie.';
    panel.querySelectorAll<HTMLButtonElement>('.mode-card[data-mode]').forEach(button=>button.disabled=true);
    el('join-controls').hidden=true;
  }
  el('local-mode').onclick=()=>{panel.hidden=true;onLocalMode();};
  el('join-room').onclick = () => send({type:'join',code:code.value.trim().toUpperCase()});
  el('ready-room').onclick = () => send({type:'ready'});
  el('leave-room').onclick = () => {leaving=true;send({type:'leave'});};
  pickEl('offer-tab').onclick=()=>{collectionView=false;selectedId=null;renderPicker();};
  pickEl('collection-tab').onclick=()=>{if(currentState?.collectionUsed)return;collectionView=true;selectedId=null;renderPicker();};
  confirm.onclick=()=>{
    if(!currentState || !canAim || choicePending)return;
    const angle=Number(angleInput.value)*Math.PI/180;
    if(currentState.phase==='select'){
      if(!selectedId)return;
      choicePending=true;canAim=false;renderPicker();
      send({type:'select',id:selectedId,collection:collectionView,angle});
    }else if(currentState.phase==='aim'){
      choicePending=true;canAim=false;renderPicker();send({type:'aim',angle});
    }
  };
  el('rematch').onclick = () => send({type:'rematch'});
  angleInput.oninput=()=>{if(canAim)setAngleDegrees(Number(angleInput.value));};
  if(sessionToken && onlineConfigured)send({type:'resume',token:sessionToken});
  return { showMenu(){panel.hidden=false;el('mode-options').hidden=false;el('join-controls').hidden=!onlineConfigured;el('room-actions').hidden=true;}, leave(){leaving=true;send({type:'leave'});}, setAngle(angle: number) {
    if (!canAim) return;
    setAngleDegrees(angle*180/Math.PI);
  }, canAim: () => canAim };
}
