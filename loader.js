(()=>{
const cssParts=['parts/styles.0.txt', 'parts/styles.1.txt', 'parts/styles.2.txt'];
const jsParts=['parts/app.0.txt', 'parts/app.1.txt', 'parts/app.2.txt', 'parts/app.3.txt', 'parts/app.4.txt', 'parts/app.5.txt'];
const get=async p=>{const r=await fetch(p);if(!r.ok)throw new Error(`No se pudo cargar ${p}`);return r.text()};
Promise.all(cssParts.map(get)).then(a=>{const s=document.createElement('style');s.textContent=a.join('');document.head.appendChild(s);return Promise.all(jsParts.map(get));}).then(a=>{new Function(a.join(''))();}).catch(e=>{console.error(e);document.body.innerHTML='<div style="font-family:system-ui;padding:30px;text-align:center"><h2>No pude cargar el juego</h2><p>Recarga la página e inténtalo otra vez.</p></div>';});
})();
