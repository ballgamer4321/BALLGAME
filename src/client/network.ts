import type { Rooms } from '../server/rooms';
import { MATCH_BALLS } from '../shared/config';
import { BALL_CRATE_COST, BALL_SHOP, COSMETICS } from '../shared/progression';
import { buyCosmetic, equipCosmetic, getCachedProgress, getProfileMessage, getProfileToken, isProfileOnline, openBallCrate, refreshProfile } from './profile';
import { adsProvider } from './ads';
type Snapshot = ReturnType<Rooms['snapshot']>;
export function connectRooms(onState: (s: Snapshot) => void, onLeave: () => void, onAimChange: (angle: number, slot: number) => void, onLocalMode: () => void) {
  const panel = document.createElement('section'); panel.className = 'control-panel home-network';
  panel.innerHTML = `<div id="profile-strip" class="profile-strip"><div><span class="eyebrow">PROFIL GOŚCIA</span><strong id="profile-summary">Ładowanie zapisu…</strong></div><span class="profile-coin-count"><strong id="profile-balance">0</strong><span>MONETY</span></span><button id="open-collection" class="collection-open" type="button">Kolekcja <span>↗</span></button></div><section id="collection-panel" class="collection-panel" aria-label="Kolekcja i sklep" hidden><button id="collection-back" class="back-button" type="button">← Wróć do trybów</button><span class="eyebrow">KOLEKCJA</span><h2>Kulki i wygląd</h2><div class="collection-stats"><strong><span id="collection-coins">0</span> ◈</strong><span><b id="collection-matches">0</b> meczów · <b id="collection-wins">0</b> wygranych</span></div><p id="collection-note" role="status">Ładowanie zapisu…</p><div id="collection-tabs" class="collection-tabs"><button id="ball-shop-tab" type="button" aria-pressed="true">Kulki</button><button id="cosmetic-shop-tab" type="button" aria-pressed="false">Kosmetyki</button></div><div id="ball-shop-layout" class="ball-shop-layout"><div id="ball-shop" class="ball-shop"></div><aside id="ball-crate" class="ball-crate" aria-label="Skrzynka z losową kulką"><div class="crate-art" aria-hidden="true"><span>✦</span></div><span class="eyebrow">ORBITAL DROP</span><h3>Skrzynka kul</h3><p>Jedna losowa kulka, której jeszcze nie masz. Bez duplikatów.</p><div class="crate-economy"><span>Twoje saldo <b><strong id="crate-balance">0</strong> ◈</b></span><span>W puli <b id="crate-count">—</b></span></div><button id="open-ball-crate" class="cosmetic-action" type="button">Otwórz · ${BALL_CRATE_COST} ◈</button><div id="crate-reveal" class="crate-reveal" role="status" hidden></div></aside></div><div id="cosmetic-list" class="cosmetic-list" hidden></div><p class="collection-footnote">Nagrody: wygrana 100 · remis 75 · przegrana 50 monet. Skrzynka: ${BALL_CRATE_COST} monet.</p></section><p id="network-status" role="status">Arena gotowa. Wybierz swoje starcie.</p><div id="mode-options" class="mode-options"><button class="mode-card" data-mode="1v1" type="button"><span class="mode-card-icon">◈</span><strong>Pojedynek 1v1</strong><small>Jeden na jednego. Bez miejsca na błędy.</small><span class="mode-card-arrow">↗</span></button><button class="mode-card" data-mode="2v2" type="button"><span class="mode-card-icon">✦</span><strong>Starcie drużyn 2v2</strong><small>Cztery kulki. Dwa zespoły. Jedna arena.</small><span class="mode-card-arrow">↗</span></button><button class="mode-card" data-mode="bot" type="button"><span class="mode-card-icon">◇</span><strong>Rzuć wyzwanie botowi</strong><small>Sprawdź kulki i własną taktykę.</small><span class="mode-card-arrow">↗</span></button><button class="mode-card" id="local-mode" type="button"><span class="mode-card-icon">◎</span><strong>Bitwa lokalna</strong><small>Dwie kulki, jeden ekran. Ty wybierasz zestaw.</small><span class="mode-card-arrow">↗</span></button></div><div id="join-controls" class="join-controls"><label for="room-code">Masz kod zaproszenia?</label><input id="room-code" maxlength="6" autocomplete="off" placeholder="KOD POKOJU"><button id="join-room" type="button">Wejdź na arenę ↗</button></div><div id="room-actions" class="room-actions" hidden><div id="room-roster" class="room-roster"></div><button id="ready-room" class="primary" type="button" hidden>Jestem gotowy <span>↗</span></button><div id="round-controls" hidden><p id="score-line"></p><p id="match-summary" hidden></p><button id="rematch" class="primary" type="button" hidden>Rewanż <span>↗</span></button></div><label id="invite-label" for="room-link" hidden>Link zaproszenia</label><input id="room-link" readonly aria-label="Link zaproszenia" hidden><button id="leave-room" class="back-button" type="button" hidden>← Opuść pokój</button></div>`;
  const coinCounter = panel.querySelector<HTMLElement>('.profile-coin-count')!;
  const coinBalance = panel.querySelector<HTMLElement>('#profile-balance')!;
  coinCounter.classList.add('header-coin');
  document.querySelector('.header')!.append(coinCounter);
  panel.querySelectorAll<HTMLElement>('.mode-card-icon').forEach((icon, index) => {
    icon.textContent = String(index + 1).padStart(2, '0');
    icon.setAttribute('aria-hidden', 'true');
  });
  document.querySelector('.home-content')!.prepend(panel);
  const el = <T extends HTMLElement>(id:string) => panel.querySelector<T>('#'+id)!;
  const viewport = document.querySelector<HTMLElement>('.viewport')!;
  const overlay = document.createElement('section');
  overlay.id='selection-overlay';overlay.className='selection-overlay';overlay.hidden=true;overlay.setAttribute('aria-label','Wybór kulki przed rundą');
  overlay.innerHTML=`<div class="selection-shell"><div class="selection-heading"><span id="selection-step-label" class="eyebrow">KROK 1 / 2</span><h2 id="selection-step-title">Wybierz kulkę</h2><p id="selection-step-hint">Trzy losowe propozycje albo cała kolekcja raz na mecz.</p></div><div id="selection-players" class="selection-players"></div><div id="selection-tabs" class="selection-tabs"><button id="offer-tab" type="button">3 losowe kulki</button><button id="collection-tab" type="button">Moje kulki · raz na mecz</button></div><div id="selection-cards" class="selection-cards" role="group" aria-label="Kulki do wyboru"></div><div id="selection-aim" class="selection-aim"><div class="direction-copy"><strong>Przeciągnij po arenie <output id="selection-angle-value">0°</output></strong><span>Ustaw tor, ciągnąc od swojej kulki. Zatwierdź kierunek, gdy strzałka będzie dobrze ustawiona.</span></div></div><div class="selection-bottom"><button id="confirm-selection" class="primary" type="button" disabled>Potwierdź kulkę i kierunek ↗</button><p id="selection-note" role="status">Walka zacznie się, gdy wszyscy gracze wybiorą kulki.</p></div></div>`;
  viewport.append(overlay);
  const pickEl=<T extends HTMLElement>(id:string)=>overlay.querySelector<T>('#'+id)!;
  const code = el<HTMLInputElement>('room-code');
  code.value = new URLSearchParams(location.search).get('room')?.toUpperCase().slice(0,6) || '';
  let socket: WebSocket | undefined;
  const hosted=import.meta.env.PROD && !import.meta.env.VITE_WS_URL?.trim();
  let onlineConfigured=!hosted;
  let previousPhase='';
  let currentSlot = 0;
  let canAim = false;
  let leaving = false;
  let sessionToken = sessionStorage.getItem('orbita-room-token');
  let sessionCode = sessionStorage.getItem('orbita-room-code');
  let pollTimer: ReturnType<typeof setTimeout> | undefined;
  let httpQueue = Promise.resolve();
  const status = el('network-status');
  let currentState:Snapshot|null=null;
  let collectionSection:'balls'|'cosmetics'='balls';
  let crateOpening=false;
  let roundKey='';
  let cardsKey='';
  let selectedId:string|null=null;
  let collectionView=false;
  let choicePending=false;
  let pickerError='';
  let lastRewardRefresh='';
  const angleOutput=pickEl<HTMLOutputElement>('selection-angle-value');
  let angleDegrees=0;
  const confirm=pickEl<HTMLButtonElement>('confirm-selection');
  function renderCollection() {
    const progress=getCachedProgress();
    const list=el('cosmetic-list');
    list.replaceChildren();
    const ballList=el('ball-shop');
    ballList.replaceChildren();
    el('collection-tabs').hidden=!progress;
    el<HTMLButtonElement>('ball-shop-tab').setAttribute('aria-pressed',String(collectionSection==='balls'));
    el<HTMLButtonElement>('cosmetic-shop-tab').setAttribute('aria-pressed',String(collectionSection==='cosmetics'));
    ballList.hidden=collectionSection!=='balls';
    el('ball-shop-layout').hidden=collectionSection!=='balls';
    list.hidden=collectionSection!=='cosmetics';
    el('profile-summary').textContent=progress?`${progress.coins} monet · ${progress.matches} meczów`:'Zapis online niedostępny';
    el('collection-note').textContent=isProfileOnline()?getProfileMessage():getProfileMessage();
    el('collection-coins').textContent=String(progress?.coins??0);
    el('collection-matches').textContent=String(progress?.matches??0);
    el('collection-wins').textContent=String(progress?.wins??0);
    coinBalance.textContent=String(progress?.coins??0);
    el('crate-balance').textContent=String(progress?.coins??0);
    const lockedBalls=progress?BALL_SHOP.filter(ball=>!progress.ownedBalls.includes(ball.id)):[];
    el('crate-count').textContent=progress?String(lockedBalls.length):'—';
    const crateButton=el<HTMLButtonElement>('open-ball-crate');
    crateButton.disabled=!progress||!isProfileOnline()||crateOpening||!lockedBalls.length||progress.coins<BALL_CRATE_COST;
    crateButton.textContent=lockedBalls.length?`Otwórz · ${BALL_CRATE_COST} ◈`:'Wszystkie kulki odblokowane';
    if(!progress){const empty=document.createElement('p');empty.className='selection-wait';empty.textContent='Kolekcja wczyta się po połączeniu z zapisem online. Lokalna gra działa bez profilu.';ballList.append(empty);return;}
    for(const ball of BALL_SHOP){
      const owned=progress.ownedBalls.includes(ball.id);
      const card=document.createElement('article');card.className='ball-shop-card';
      card.innerHTML=`<span class="cosmetic-swatch" style="--cosmetic:${ball.color}"></span><div class="ball-shop-copy"><strong>${ball.name}</strong><small>${ball.trigger.toUpperCase()}</small><p>${ball.ability}</p><p class="ball-shop-weakness">Słabość: ${ball.weakness}</p></div>`;
      const ownership=document.createElement('span');ownership.className=owned?'ball-unlock-status is-owned':'ball-unlock-status';
      ownership.textContent=owned?'✓ Posiadana':'W skrzynce';
      card.append(ownership);ballList.append(card);
    }
    for(const cosmetic of COSMETICS){
      const owned=progress.ownedCosmetics.includes(cosmetic.id);
      const equipped=progress.equippedCosmetic===cosmetic.id;
      const card=document.createElement('article');card.className='cosmetic-card';
      card.innerHTML=`<span class="cosmetic-swatch" style="--cosmetic:${cosmetic.color}"></span><div><strong>${cosmetic.name}</strong><p>${cosmetic.description}</p></div>`;
      const button=document.createElement('button');button.type='button';button.className='cosmetic-action';
      button.textContent=equipped?'Używany':owned?'Użyj':`Odblokuj · ${cosmetic.cost} ◈`;
      button.disabled=!isProfileOnline()||equipped||(!owned&&progress.coins<cosmetic.cost);
      button.onclick=async()=>{
        button.disabled=true;el('collection-note').textContent='Zapisuję…';
        try{if(owned)await equipCosmetic(cosmetic.id);else await buyCosmetic(cosmetic.id);renderCollection();}
        catch(error){el('collection-note').textContent=error instanceof Error?error.message:'Nie udało się zapisać kosmetyku.';button.disabled=false;}
      };
      card.append(button);list.append(card);
    }
  }
  el<HTMLButtonElement>('open-ball-crate').onclick=async()=>{
    if(crateOpening)return;
    crateOpening=true;
    const crate=el<HTMLElement>('ball-crate');
    const reveal=el<HTMLElement>('crate-reveal');
    crate.classList.remove('is-opening');void crate.offsetWidth;crate.classList.add('is-opening');
    reveal.hidden=true;
    el('collection-note').textContent='Skrzynka się otwiera…';
    let finalMessage='';
    try{
      const {ball}=await openBallCrate();
      const orb=document.createElement('span');orb.className='crate-reveal-orb';orb.style.setProperty('--orb',ball.color);orb.setAttribute('aria-hidden','true');
      const copy=document.createElement('div');copy.className='crate-reveal-copy';
      const eyebrow=document.createElement('small');eyebrow.textContent='NOWA KULKA';
      const name=document.createElement('strong');name.textContent=ball.name;
      const ability=document.createElement('span');ability.textContent=ball.ability;
      copy.append(eyebrow,name,ability);reveal.replaceChildren(orb,copy);reveal.hidden=false;
      finalMessage=`Odblokowano ${ball.name}. Zapisano w kolekcji.`;
    }catch(error){finalMessage=error instanceof Error?error.message:'Nie udało się otworzyć skrzynki.';}
    finally{
      crateOpening=false;crate.classList.remove('is-opening');renderCollection();
      el('collection-note').textContent=finalMessage||getProfileMessage();
    }
  };
  window.addEventListener('orbita-profile-updated',renderCollection);
  el('open-collection').onclick=()=>{el('profile-strip').hidden=true;el('network-status').hidden=true;el('mode-options').hidden=true;el('join-controls').hidden=true;el('room-actions').hidden=true;el('collection-panel').hidden=false;renderCollection();};
  el('collection-back').onclick=()=>{el('collection-panel').hidden=true;el('profile-strip').hidden=false;el('network-status').hidden=false;el('mode-options').hidden=false;el('join-controls').hidden=!onlineConfigured;};
  el('ball-shop-tab').onclick=()=>{collectionSection='balls';renderCollection();};
  el('cosmetic-shop-tab').onclick=()=>{collectionSection='cosmetics';renderCollection();};
  void refreshProfile().catch(()=>renderCollection());
  function setAngleDegrees(degrees:number){
    const value=Math.max(-180,Math.min(180,Math.round(degrees)));
    angleDegrees=value;
    angleOutput.textContent=`${value}°`;
    onAimChange(value*Math.PI/180,currentSlot);
  }
  function renderPicker(){
    const data=currentState;
    const preparing=!!data && (data.phase==='select' || data.phase==='aim');
    overlay.hidden=!preparing;
    overlay.classList.toggle('is-aiming',!!data && data.phase==='aim');
    overlay.querySelector('.selection-shell')!.classList.toggle('is-aiming',!!data && data.phase==='aim');
    viewport.classList.toggle('selection-active',preparing);
    if(!data || !preparing)return;
    const chosen=data.players.filter(player=>player.chosen).length;
    const myChoice=!!data.pick || choicePending;
    const choosing=data.phase==='select'&&!myChoice;
    const aiming=data.phase==='aim'&&!data.angleLocked&&!choicePending;
    pickEl('selection-step-label').textContent=data.phase==='aim'?'KROK 2 / 2':'KROK 1 / 2';
    pickEl('selection-step-title').textContent=data.phase==='aim'?'Ustaw kierunek':'Wybierz kulkę';
    pickEl('selection-step-hint').textContent=data.phase==='aim'?'Przeciągnij po arenie od swojej kulki, a potem zablokuj kierunek.':'Wybierz jedną z trzech propozycji albo skorzystaj z kolekcji.';
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
        const ids=collectionView?data.ownedBalls:data.offer;
        for(const id of ids){
          const def=MATCH_BALLS.find(ball=>ball.id===id)!;
          const button=document.createElement('button');button.type='button';button.className='ball-card';
          button.setAttribute('aria-pressed',String(selectedId===id));
          button.innerHTML=`<span class="ball-card-orb" style="--orb:${def.color}"></span><strong>${def.name}</strong><small>${def.trigger.toUpperCase()} · ${def.hp} HP</small><span class="ball-card-ability">${def.ability}</span><span class="ball-card-weakness">Słabość: ${def.weakness}</span>`;
          button.onclick=()=>{selectedId=id;pickerError='';renderPicker();};cards.append(button);
        }
      }else{
        const name=MATCH_BALLS.find(ball=>ball.id===data.pick)?.name;
        const wait=document.createElement('p');wait.className='selection-wait';
        wait.textContent=data.phase==='aim'?'Kulki wybrane. Ustaw kierunek.':name?`${name} wybrany. Czekamy na pozostałych graczy…`:'Wybór zapisany. Czekamy na pozostałych graczy…';cards.append(wait);
      }
    }
    cards.hidden=data.phase==='aim';
    pickEl('selection-aim').hidden=data.phase!=='aim'||!aiming;
    confirm.hidden=!choosing&&!aiming;
    confirm.disabled=choicePending || (choosing&&!selectedId);
    confirm.textContent=data.phase==='aim'?'Zablokuj kierunek ↗':'Potwierdź kulkę ↗';
    pickEl('selection-note').textContent=pickerError || (data.phase==='aim'?(data.angleLocked||choicePending?'Kierunek zapisany. Czekamy na pozostałych graczy.':'Kierunek można zmienić przed potwierdzeniem.'):(myChoice?`Wybrano ${chosen} z ${data.players.length}. Czekamy na pozostałych.`:'Najpierw wszyscy wybierają kulki; potem ustawią kierunek.'));
  }
  function handleData(data: Snapshot & { type: string; token?: string; message?: string; reward?: number }, requestedType='') {
      if (data.type === 'error') { status.textContent = data.message || 'Błąd serwera';pickerError=data.message || 'Błąd serwera';choicePending=false;renderPicker(); if(requestedType==='resume' && hosted){sessionStorage.removeItem('orbita-room-token');sessionStorage.removeItem('orbita-room-code');sessionToken=null;sessionCode=null;onLeave();} return; }
      if (data.token) {sessionToken=data.token;sessionStorage.setItem('orbita-room-token',data.token);}
      if (data.type === 'session') return;
      if (data.type === 'left') {sessionStorage.removeItem('orbita-room-token');sessionStorage.removeItem('orbita-room-code');sessionToken=null;sessionCode=null;onLeave();return;}
      if (data.type !== 'state') return;
      currentState=data;
      sessionCode=data.code;sessionStorage.setItem('orbita-room-code',data.code);
      currentSlot = data.slot;
      if(data.phase==='match_result' && data.matchId && lastRewardRefresh!==data.matchId){
        lastRewardRefresh=data.matchId;void refreshProfile().catch(()=>{});
        if(adsProvider.isAvailable())void adsProvider.showInterstitial().catch(()=>false);
      }
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
      el('profile-strip').hidden=true;el('collection-panel').hidden=true;
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
      if(data.phase==='match_result')el('match-summary').textContent=(data.score[0]===data.score[1]?'Mecz zakończony remisem':`Mecz wygrywa ${data.mode==='2v2'?'drużyna':'gracz'} ${data.score[0]>data.score[1]?1:2}`)+(data.reward?` · +${data.reward} ◈`:'');
      renderPicker();
      el('rematch').hidden = data.phase !== 'match_result' || !data.rematchAvailable;
      const link = el<HTMLInputElement>('room-link'); link.hidden = data.mode === 'bot';
      el('invite-label').hidden=data.mode==='bot';
      const url = new URL(location.href); url.searchParams.set('room', data.code); link.value = url.href;
      onState(data);
      previousPhase=data.phase;
  }
  function schedulePoll() {
    if(!hosted || !sessionToken || !sessionCode || leaving)return;
    clearTimeout(pollTimer);
    const delay=currentState?.phase==='fight'?1100:currentState?.phase==='match_result'?2500:650;
    pollTimer=setTimeout(()=>send({type:'poll'}),delay);
  }
  function send(action: {type:string;[key:string]:unknown}) {
    if(hosted){
      clearTimeout(pollTimer);
      httpQueue=httpQueue.catch(()=>{}).then(async()=>{
        const body:Record<string,unknown>={...action,code:action.code ?? sessionCode,token:sessionToken};
        if(action.type==='create'||action.type==='join')body.profileToken=getProfileToken();
        try{
          const response=await fetch('/api/room',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store'});
          const data=await response.json();
          handleData(data,action.type);
          if(!response.ok && (response.status===401 || response.status===404) && !['create','join'].includes(action.type)){
            sessionStorage.removeItem('orbita-room-token');sessionStorage.removeItem('orbita-room-code');
            sessionToken=null;sessionCode=null;onLeave();return;
          }
          if(!response.ok && response.status>=500)status.textContent=data.message || 'Serwer gry jest chwilowo niedostępny.';
          if(!response.ok && action.type==='leave')leaving=false;
        }catch{status.textContent='Połączenie przerwane. Próbuję ponownie…';choicePending=false;leaving=false;renderPicker();}
        schedulePoll();
      });
      return;
    }
    if (socket?.readyState === WebSocket.OPEN) { socket.send(JSON.stringify(action)); return; }
    if (socket?.readyState === WebSocket.CONNECTING) return;
    status.textContent = 'Łączenie…';
    const endpoint=import.meta.env.VITE_WS_URL?.trim() || `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws`;
    socket = new WebSocket(endpoint);
    socket.onopen = () => socket!.send(JSON.stringify(action));
    socket.onmessage = event => handleData(JSON.parse(event.data));
    socket.onclose = () => {status.textContent = 'Połączenie przerwane. Próbuję wrócić do pokoju…';el<HTMLButtonElement>('ready-room').disabled=true;if(!leaving && sessionToken)setTimeout(()=>send({type:'resume',token:sessionToken}),1200);};
    socket.onerror = () => { status.textContent = 'Nie można połączyć się z serwerem gry.'; };
  }
  panel.querySelectorAll<HTMLButtonElement>('.mode-card[data-mode]').forEach(button=>button.onclick=()=>send({type:'create',mode:button.dataset.mode}));
  if(hosted){
    panel.querySelectorAll<HTMLButtonElement>('.mode-card[data-mode]').forEach(button=>button.disabled=true);
    el('join-controls').hidden=true;
    status.textContent='Sprawdzam serwer 1v1…';
    fetch('/api/room',{cache:'no-store'}).then(response=>response.json()).then(data=>{
      if(!data.online)throw new Error('Serwer 1v1 nie jest jeszcze gotowy. Gra lokalna jest dostępna.');
      onlineConfigured=true;
      el<HTMLButtonElement>('join-room').disabled=false;
      el('join-controls').hidden=false;
      el('mode-options').hidden=false;
      panel.querySelector<HTMLButtonElement>('.mode-card[data-mode="1v1"]')!.disabled=false;
      status.textContent='Graj 1v1 online: utwórz pokój albo wpisz kod zaproszenia.';
      if(sessionToken && sessionCode)send({type:'resume',token:sessionToken});
    }).catch(()=>{status.textContent='Serwer 1v1 nie jest jeszcze gotowy. Gra lokalna jest dostępna.';});
  }
  el('local-mode').onclick=()=>{panel.hidden=true;onLocalMode();};
  el('join-room').onclick = () => send({type:'join',code:code.value.trim().toUpperCase()});
  el('ready-room').onclick = () => send({type:'ready'});
  el('leave-room').onclick = () => {leaving=true;send({type:'leave'});};
  pickEl('offer-tab').onclick=()=>{collectionView=false;selectedId=null;renderPicker();};
  pickEl('collection-tab').onclick=()=>{if(currentState?.collectionUsed)return;collectionView=true;selectedId=null;renderPicker();};
  confirm.onclick=()=>{
    if(!currentState || !canAim || choicePending)return;
    const angle=angleDegrees*Math.PI/180;
    if(currentState.phase==='select'){
      if(!selectedId)return;
      choicePending=true;canAim=false;renderPicker();
      send({type:'select',id:selectedId,collection:collectionView});
    }else if(currentState.phase==='aim'){
      choicePending=true;canAim=false;renderPicker();send({type:'aim',angle});
    }
  };
  el('rematch').onclick = () => send({type:'rematch'});
  if(sessionToken && !hosted)send({type:'resume',token:sessionToken});
  return { showMenu(){panel.hidden=false;el('profile-strip').hidden=false;el('collection-panel').hidden=true;el('network-status').hidden=false;el('mode-options').hidden=false;el('join-controls').hidden=!onlineConfigured;el('room-actions').hidden=true;}, leave(){leaving=true;send({type:'leave'});}, setAngle(angle: number) {
    if (!canAim) return;
    setAngleDegrees(angle*180/Math.PI);
  }, canAim: () => canAim };
}
