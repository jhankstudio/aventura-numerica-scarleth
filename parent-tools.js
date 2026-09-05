(() => {
  'use strict';
  const STORAGE_KEY='aventuraNumericaScarlethV2';
  const BACKUP_KEY='aventuraNumericaScarlethAdultBackup';
  const WORLDS=[
    {name:'Jardín Mágico',range:'1–10',min:1,max:10,emoji:'🌳'},
    {name:'Reino Dulce',range:'11–20',min:11,max:20,emoji:'🍭'},
    {name:'Mundo Marino',range:'21–50',min:21,max:50,emoji:'🌊'},
    {name:'Bosque Encantado',range:'51–100',min:51,max:100,emoji:'🦄'},
    {name:'Viaje Espacial',range:'101–200',min:101,max:200,emoji:'🚀'},
    {name:'Castillo Arcoíris',range:'201–300',min:201,max:300,emoji:'🏰'}
  ];

  function readState(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'null')}catch{return null}}
  function writeState(s){localStorage.setItem(STORAGE_KEY,JSON.stringify(s))}
  function backupState(){const s=readState();if(s)sessionStorage.setItem(BACKUP_KEY,JSON.stringify(s));return s}
  function encodeState(s){const bytes=new TextEncoder().encode(JSON.stringify(s));let bin='';for(const b of bytes)bin+=String.fromCharCode(b);return 'SCARLETH-'+btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
  function decodeState(code){
    let raw=String(code||'').trim();if(raw.startsWith('SCARLETH-'))raw=raw.slice(9);raw=raw.replace(/-/g,'+').replace(/_/g,'/');while(raw.length%4)raw+='=';
    const bin=atob(raw),bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
    const data=JSON.parse(new TextDecoder().decode(bytes));if(!data||typeof data!=='object')throw new Error('Código inválido');
    const n=Number(data.currentNumber);if(!Number.isFinite(n)||n<1||n>300)throw new Error('Progreso inválido');
    data.currentNumber=Math.max(1,Math.min(300,Math.round(n)));data.maxCompleted=Math.max(0,Math.min(300,Number(data.maxCompleted)||0));data.stars=Math.max(0,Number(data.stars)||0);data.rewards=Array.isArray(data.rewards)?data.rewards:[];data.errorsByNumber=(data.errorsByNumber&&typeof data.errorsByNumber==='object')?data.errorsByNumber:{};data.totalErrors=Math.max(0,Number(data.totalErrors)||0);data.lastPlayed=Date.now();return data;
  }
  function status(msg,good=true){const el=document.getElementById('parentToolStatus');if(!el)return;el.textContent=msg;el.dataset.good=good?'1':'0'}
  function reloadFresh(){const u=new URL(location.href);u.searchParams.set('v',String(Date.now()));location.replace(u.toString())}

  function injectStyles(){
    if(document.getElementById('parentToolsStyle'))return;
    const st=document.createElement('style');st.id='parentToolsStyle';st.textContent=`
      .parent-tools-card{background:#fff;border:1px solid #e8edf2;border-radius:20px;padding:16px;margin-top:14px;box-shadow:0 5px 0 rgba(39,71,109,.05)}
      .parent-tools-card h3{margin:0 0 6px;font-size:18px;color:#27476d}.parent-tools-card p{margin:0 0 12px;color:#6d7d8d;font-size:13px;line-height:1.45}
      .adult-world-picker{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.adult-world-pick{border:0;border-radius:16px;padding:12px 9px;background:#f5f8fb;color:#27476d;font-weight:800;cursor:pointer;box-shadow:0 3px 0 rgba(39,71,109,.08)}
      .adult-world-pick.selected{outline:3px solid #83bce3;background:#eef8ff}.adult-world-pick span{display:block;font-size:25px;margin-bottom:3px}.adult-world-pick small{display:block;font-weight:700;color:#75869a;margin-top:2px}.adult-world-pick:active{transform:translateY(2px);box-shadow:0 1px 0 rgba(39,71,109,.08)}
      .world-number-panel{margin-top:13px;padding:13px;border-radius:17px;background:#f8fafc;border:1px solid #e4eaf0}.world-number-panel.hidden{display:none}.world-number-title{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:9px}.world-number-title b{color:#27476d}.world-number-title small{color:#728396;font-weight:750}
      .number-control{display:grid;grid-template-columns:1fr auto;gap:8px}.number-control input{width:100%;border:1px solid #d8e1e9;border-radius:14px;padding:11px 12px;font-size:18px;font-weight:850;color:#27476d;background:white}.number-control button,.number-actions button{border:0;border-radius:14px;padding:11px 12px;font-weight:850;cursor:pointer}.number-control button{background:#e5f1fb;color:#2f6185}.number-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:9px}.open-number{background:#e3f5e9;color:#2e6845}.unlock-number{background:#fff0cf;color:#765b18}.number-note{font-size:11px!important;margin:8px 0 0!important;color:#7b8897!important}
      .parent-backup-row{display:flex;gap:8px;margin-top:10px}.parent-backup-row button,.progress-code-actions button{flex:1;border:0;border-radius:14px;padding:11px 10px;font-weight:850;cursor:pointer}.restore-progress{background:#fff0d1;color:#725a1b}
      .progress-code-box{width:100%;min-height:84px;resize:vertical;border:1px solid #d9e2ea;border-radius:14px;padding:10px;font:12px/1.4 ui-monospace,SFMono-Regular,Consolas,monospace;color:#34495e;background:#fbfcfd;outline:none}.progress-code-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:9px}.copy-progress{background:#dff4e8;color:#285d42}.import-progress{background:#e9e2fb;color:#564091}.share-progress{grid-column:1/-1;background:#e2f2fb;color:#245b78}.parent-status{min-height:18px;margin-top:8px;font-size:12px;font-weight:750;color:#3f7b58}.parent-status[data-good="0"]{color:#a34c56}
      @media(max-width:430px){.adult-world-picker{grid-template-columns:1fr 1fr}.number-actions,.progress-code-actions{grid-template-columns:1fr}.share-progress{grid-column:auto}}
    `;document.head.appendChild(st);
  }

  function buildUI(){
    const adult=document.getElementById('adultScreen'),actions=adult?.querySelector('.adult-actions');
    if(!adult||!actions||document.getElementById('parentWorldTools'))return false;
    injectStyles();

    const worldCard=document.createElement('div');worldCard.id='parentWorldTools';worldCard.className='parent-tools-card';
    worldCard.innerHTML=`<h3>Elegir mundo y número</h3><p>Toca un mundo. Luego puedes abrir cualquier número o desbloquear todo hasta ese número. Esto no borra estrellas ni premios.</p><div class="adult-world-picker" id="adultWorldPicker"></div><div id="worldNumberPanel" class="world-number-panel hidden"><div class="world-number-title"><b id="selectedWorldName">Mundo</b><small id="selectedWorldRange">1–10</small></div><div class="number-control"><input id="adultSelectedNumber" type="number" min="1" max="10" value="1" inputmode="numeric"><button id="goWorldStart" type="button">Inicio</button></div><div class="number-actions"><button id="openSelectedNumber" class="open-number" type="button">▶ Abrir este número</button><button id="unlockSelectedNumber" class="unlock-number" type="button">🔓 Desbloquear hasta aquí</button></div><p class="number-note">“Abrir” solo mueve el juego a ese número. “Desbloquear” deja accesibles también los anteriores hasta ese punto.</p></div><div class="parent-backup-row"><button class="restore-progress" id="restoreAdultBackup" type="button">↩ Restaurar progreso anterior</button></div>`;
    actions.parentNode.insertBefore(worldCard,actions);
    const picker=worldCard.querySelector('#adultWorldPicker'),panel=worldCard.querySelector('#worldNumberPanel'),input=worldCard.querySelector('#adultSelectedNumber');let selectedWorld=null;
    function selectWorld(w,btn){selectedWorld=w;[...picker.children].forEach(x=>x.classList.remove('selected'));btn?.classList.add('selected');panel.classList.remove('hidden');worldCard.querySelector('#selectedWorldName').textContent=`${w.emoji} ${w.name}`;worldCard.querySelector('#selectedWorldRange').textContent=w.range;input.min=w.min;input.max=w.max;input.value=w.min}
    WORLDS.forEach(w=>{const b=document.createElement('button');b.type='button';b.className='adult-world-pick';b.innerHTML=`<span>${w.emoji}</span>${w.name}<small>${w.range}</small>`;b.addEventListener('click',()=>selectWorld(w,b));picker.appendChild(b)});
    worldCard.querySelector('#goWorldStart').addEventListener('click',()=>{if(selectedWorld)input.value=selectedWorld.min});
    function chosen(){if(!selectedWorld)return null;const n=Math.max(selectedWorld.min,Math.min(selectedWorld.max,parseInt(input.value||selectedWorld.min,10)||selectedWorld.min));input.value=n;return n}
    worldCard.querySelector('#openSelectedNumber').addEventListener('click',()=>{const n=chosen();if(n==null)return;const s=backupState();if(!s)return status('No pude leer el progreso actual.',false);if(!confirm(`¿Abrir el número ${n}?\n\nNo se borrarán estrellas ni premios.`))return;s.currentNumber=n;s.lastPlayed=Date.now();writeState(s);reloadFresh()});
    worldCard.querySelector('#unlockSelectedNumber').addEventListener('click',()=>{const n=chosen();if(n==null)return;const s=backupState();if(!s)return status('No pude leer el progreso actual.',false);if(!confirm(`¿Desbloquear todos los números hasta ${n}?\n\nEsto no añadirá estrellas falsas; solo abrirá el acceso.`))return;s.maxCompleted=Math.max(Number(s.maxCompleted)||0,n-1);s.currentNumber=n;s.lastPlayed=Date.now();writeState(s);reloadFresh()});
    worldCard.querySelector('#restoreAdultBackup').addEventListener('click',()=>{const backup=sessionStorage.getItem(BACKUP_KEY);if(!backup)return status('No hay una copia temporal para restaurar.',false);if(!confirm('¿Restaurar el progreso que tenías antes del último cambio adulto?'))return;localStorage.setItem(STORAGE_KEY,backup);sessionStorage.removeItem(BACKUP_KEY);reloadFresh()});

    const syncCard=document.createElement('div');syncCard.className='parent-tools-card';syncCard.innerHTML='<h3>Pasar progreso a otro celular</h3><p>Genera un código en el celular actual. En el otro dispositivo abre Zona adulta, pega el código y pulsa Importar.</p><textarea id="progressCodeBox" class="progress-code-box" placeholder="Aquí aparecerá o puedes pegar el código de progreso"></textarea><div class="progress-code-actions"><button id="copyProgress" class="copy-progress" type="button">📋 Copiar progreso</button><button id="importProgress" class="import-progress" type="button">📥 Importar progreso</button><button id="shareProgress" class="share-progress" type="button">📤 Compartir código</button></div><div id="parentToolStatus" class="parent-status" data-good="1"></div>';
    actions.parentNode.insertBefore(syncCard,actions);const box=syncCard.querySelector('#progressCodeBox');
    syncCard.querySelector('#copyProgress').addEventListener('click',async()=>{const s=readState();if(!s)return status('No pude leer el progreso.',false);const code=encodeState(s);box.value=code;try{await navigator.clipboard.writeText(code);status('Código copiado. Pégalo en el otro celular.')}catch{box.select();document.execCommand?.('copy');status('Código listo. Cópialo y envíalo al otro celular.')}});
    syncCard.querySelector('#shareProgress').addEventListener('click',async()=>{const s=readState();if(!s)return status('No pude leer el progreso.',false);const code=encodeState(s);box.value=code;if(navigator.share){try{await navigator.share({title:'Progreso de Scarleth',text:code});status('Código compartido.');return}catch(e){if(e?.name==='AbortError')return}}try{await navigator.clipboard.writeText(code);status('Código copiado para compartir.')}catch{status('Código listo para copiar y compartir.')}});
    syncCard.querySelector('#importProgress').addEventListener('click',()=>{try{const next=decodeState(box.value);if(!confirm(`¿Cargar este progreso? Scarleth continuará desde el número ${next.currentNumber}.`))return;writeState(next);status('Progreso importado.');setTimeout(reloadFresh,350)}catch{status('Ese código no es válido. Revisa que esté completo.',false)}});
    return true;
  }
  let tries=0;const timer=setInterval(()=>{tries++;if(buildUI()||tries>100)clearInterval(timer)},150);
})();
