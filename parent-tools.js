(() => {
  'use strict';
  const STORAGE_KEY='aventuraNumericaScarlethV2';
  const BACKUP_KEY='aventuraNumericaScarlethAdultBackup';
  const WORLDS=[
    {name:'Jardín Mágico',range:'1–10',min:1,emoji:'🌳'},
    {name:'Reino Dulce',range:'11–20',min:11,emoji:'🍭'},
    {name:'Mundo Marino',range:'21–50',min:21,emoji:'🌊'},
    {name:'Bosque Encantado',range:'51–100',min:51,emoji:'🦄'},
    {name:'Viaje Espacial',range:'101–200',min:101,emoji:'🚀'},
    {name:'Castillo Arcoíris',range:'201–300',min:201,emoji:'🏰'}
  ];

  function readState(){
    try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'null')}catch{return null}
  }
  function writeState(s){ localStorage.setItem(STORAGE_KEY,JSON.stringify(s)); }
  function encodeState(s){
    const bytes=new TextEncoder().encode(JSON.stringify(s));
    let bin=''; for(const b of bytes) bin+=String.fromCharCode(b);
    return 'SCARLETH-'+btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  }
  function decodeState(code){
    let raw=String(code||'').trim();
    if(raw.startsWith('SCARLETH-')) raw=raw.slice(9);
    raw=raw.replace(/-/g,'+').replace(/_/g,'/');
    while(raw.length%4) raw+='=';
    const bin=atob(raw), bytes=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
    const data=JSON.parse(new TextDecoder().decode(bytes));
    if(!data || typeof data!=='object') throw new Error('Código inválido');
    const n=Number(data.currentNumber);
    if(!Number.isFinite(n)||n<1||n>300) throw new Error('Progreso inválido');
    data.currentNumber=Math.max(1,Math.min(300,Math.round(n)));
    data.maxCompleted=Math.max(0,Math.min(300,Number(data.maxCompleted)||0));
    data.stars=Math.max(0,Number(data.stars)||0);
    data.rewards=Array.isArray(data.rewards)?data.rewards:[];
    data.errorsByNumber=(data.errorsByNumber&&typeof data.errorsByNumber==='object')?data.errorsByNumber:{};
    data.totalErrors=Math.max(0,Number(data.totalErrors)||0);
    data.lastPlayed=Date.now();
    return data;
  }
  function status(msg,good=true){
    const el=document.getElementById('parentToolStatus');
    if(!el)return; el.textContent=msg; el.dataset.good=good?'1':'0';
  }
  function injectStyles(){
    if(document.getElementById('parentToolsStyle'))return;
    const st=document.createElement('style');st.id='parentToolsStyle';st.textContent=`
      .parent-tools-card{background:#fff;border:1px solid #e8edf2;border-radius:20px;padding:16px;margin-top:14px;box-shadow:0 5px 0 rgba(39,71,109,.05)}
      .parent-tools-card h3{margin:0 0 6px;font-size:18px;color:#27476d}.parent-tools-card p{margin:0 0 12px;color:#6d7d8d;font-size:13px;line-height:1.45}
      .adult-world-picker{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.adult-world-pick{border:0;border-radius:16px;padding:12px 9px;background:#f5f8fb;color:#27476d;font-weight:800;cursor:pointer;box-shadow:0 3px 0 rgba(39,71,109,.08)}
      .adult-world-pick span{display:block;font-size:25px;margin-bottom:3px}.adult-world-pick small{display:block;font-weight:700;color:#75869a;margin-top:2px}.adult-world-pick:active{transform:translateY(2px);box-shadow:0 1px 0 rgba(39,71,109,.08)}
      .parent-backup-row{display:flex;gap:8px;margin-top:10px}.parent-backup-row button,.progress-code-actions button{flex:1;border:0;border-radius:14px;padding:11px 10px;font-weight:850;cursor:pointer}
      .restore-progress{background:#fff0d1;color:#725a1b}.progress-code-box{width:100%;min-height:84px;resize:vertical;border:1px solid #d9e2ea;border-radius:14px;padding:10px;font:12px/1.4 ui-monospace,SFMono-Regular,Consolas,monospace;color:#34495e;background:#fbfcfd;outline:none}
      .progress-code-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:9px}.copy-progress{background:#dff4e8;color:#285d42}.import-progress{background:#e9e2fb;color:#564091}.share-progress{grid-column:1/-1;background:#e2f2fb;color:#245b78}.parent-status{min-height:18px;margin-top:8px;font-size:12px;font-weight:750;color:#3f7b58}.parent-status[data-good="0"]{color:#a34c56}
      @media(max-width:430px){.adult-world-picker{grid-template-columns:1fr}.progress-code-actions{grid-template-columns:1fr}}
    `;document.head.appendChild(st);
  }
  function buildUI(){
    const adult=document.getElementById('adultScreen');
    const actions=adult?.querySelector('.adult-actions');
    if(!adult||!actions||document.getElementById('parentWorldTools'))return false;
    injectStyles();

    const worldCard=document.createElement('div');
    worldCard.id='parentWorldTools';worldCard.className='parent-tools-card';
    worldCard.innerHTML='<h3>Elegir mundo</h3><p>Como adulto puedes mover el punto de inicio de Scarleth a cualquier mundo. Antes de cambiarlo guardaremos una copia del progreso actual.</p><div class="adult-world-picker" id="adultWorldPicker"></div><div class="parent-backup-row"><button class="restore-progress" id="restoreAdultBackup" type="button">↩ Restaurar progreso anterior</button></div>';
    actions.parentNode.insertBefore(worldCard,actions);
    const picker=worldCard.querySelector('#adultWorldPicker');
    WORLDS.forEach(w=>{
      const b=document.createElement('button');b.type='button';b.className='adult-world-pick';b.innerHTML=`<span>${w.emoji}</span>${w.name}<small>${w.range}</small>`;
      b.addEventListener('click',()=>{
        const s=readState(); if(!s)return status('No pude leer el progreso actual.',false);
        if(!sessionStorage.getItem(BACKUP_KEY)) sessionStorage.setItem(BACKUP_KEY,JSON.stringify(s));
        if(!confirm(`¿Mover el juego a ${w.name} (${w.range})?`))return;
        s.currentNumber=w.min;
        s.maxCompleted=Math.min(Number(s.maxCompleted)||0,w.min-1);
        s.lastPlayed=Date.now();writeState(s);
        location.reload();
      });picker.appendChild(b);
    });
    worldCard.querySelector('#restoreAdultBackup').addEventListener('click',()=>{
      const backup=sessionStorage.getItem(BACKUP_KEY);
      if(!backup)return status('No hay una copia temporal para restaurar.',false);
      if(!confirm('¿Restaurar el progreso que tenías antes de cambiar de mundo?'))return;
      localStorage.setItem(STORAGE_KEY,backup);sessionStorage.removeItem(BACKUP_KEY);location.reload();
    });

    const syncCard=document.createElement('div');syncCard.className='parent-tools-card';
    syncCard.innerHTML='<h3>Pasar progreso a otro celular</h3><p>Genera un código en el celular actual. En el otro dispositivo abre Zona adulta, pega el código y pulsa Importar. Así Scarleth continúa donde iba sin empezar de cero.</p><textarea id="progressCodeBox" class="progress-code-box" placeholder="Aquí aparecerá o puedes pegar el código de progreso"></textarea><div class="progress-code-actions"><button id="copyProgress" class="copy-progress" type="button">📋 Copiar progreso</button><button id="importProgress" class="import-progress" type="button">📥 Importar progreso</button><button id="shareProgress" class="share-progress" type="button">📤 Compartir código</button></div><div id="parentToolStatus" class="parent-status" data-good="1"></div>';
    actions.parentNode.insertBefore(syncCard,actions);
    const box=syncCard.querySelector('#progressCodeBox');
    syncCard.querySelector('#copyProgress').addEventListener('click',async()=>{
      const s=readState();if(!s)return status('No pude leer el progreso.',false);
      const code=encodeState(s);box.value=code;
      try{await navigator.clipboard.writeText(code);status('Código copiado. Pégalo en el otro celular.')}catch{box.select();document.execCommand?.('copy');status('Código listo. Cópialo y envíalo al otro celular.')}
    });
    syncCard.querySelector('#shareProgress').addEventListener('click',async()=>{
      const s=readState();if(!s)return status('No pude leer el progreso.',false);
      const code=encodeState(s);box.value=code;
      if(navigator.share){try{await navigator.share({title:'Progreso de Scarleth',text:code});status('Código compartido.');return}catch(e){if(e?.name==='AbortError')return}}
      try{await navigator.clipboard.writeText(code);status('Código copiado para compartir.')}catch{status('Código listo para copiar y compartir.')}
    });
    syncCard.querySelector('#importProgress').addEventListener('click',()=>{
      try{
        const next=decodeState(box.value);
        if(!confirm(`¿Cargar este progreso? Scarleth continuará desde el número ${next.currentNumber}.`))return;
        writeState(next);status('Progreso importado.');setTimeout(()=>location.reload(),450);
      }catch(e){status('Ese código no es válido. Revisa que esté completo.',false)}
    });
    return true;
  }
  let tries=0;const timer=setInterval(()=>{tries++;if(buildUI()||tries>80)clearInterval(timer)},150);
})();
