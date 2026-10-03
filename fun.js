const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const panels = $$('.room-panel');
const roomNames = ['The room','ASCII mirror','Photo drawer','In my bag','Make a mark','Postcards','Elsewhere'];
function openRoom() {
 const id=location.hash.slice(1) || 'welcome';
 const selected=panels.find(p=>p.id===id) || panels[0];
 panels.forEach(p=>p.hidden=p!==selected);
 $$('[data-room]').forEach(a=>{if(a.dataset.room===selected.id)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 const index=panels.indexOf(selected);
 $('#window-title').textContent=roomNames[index];
 $('#window-counter').textContent=`${String(index+1).padStart(2,'0')} / 07`;
 document.title=`${roomNames[index]} — Rime’s room`;
 if(selected.id==='portrait') fitAscii();
}
window.addEventListener('hashchange',openRoom);
$('#sparkle-toggle').addEventListener('click',event=>{
 const on=$('.room-page').classList.toggle('has-stars');
 event.currentTarget.setAttribute('aria-pressed',String(on));
});
let catHello=0;
$('#pet-cat').addEventListener('click',()=>{$('#cat-reply').textContent=['mrrp.','a tiny headbutt.','purrrrr.','you may stay.'][catHello++%4];});

// All drawing coordinates use the same logical paper size, at every viewport size.
const canvas=$('#sketch-canvas'),ctx=canvas.getContext('2d');
let strokes=[],redo=[],activeStroke=null,ink='#342b39';
const storageKey='rime-room-sketch-v1';
function validStroke(s) {
 return s && /^#[\da-f]{6}$/i.test(s.color) && [2,5,10].includes(s.width) && Array.isArray(s.points) && s.points.length<=20000 && s.points.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)&&p[0]>=0&&p[0]<=900&&p[1]>=0&&p[1]<=520);
}
try {const saved=JSON.parse(localStorage.getItem(storageKey)||'[]');if(Array.isArray(saved)&&saved.length<=500&&saved.every(validStroke))strokes=saved;}catch{}
function drawStroke(s,context=ctx) {
 if(!s.points.length)return;
 context.strokeStyle=s.color;context.fillStyle=s.color;context.lineWidth=s.width;context.lineCap='round';context.lineJoin='round';
 if(s.points.length===1){context.beginPath();context.arc(...s.points[0],s.width/2,0,Math.PI*2);context.fill();return;}
 context.beginPath();context.moveTo(...s.points[0]);s.points.slice(1).forEach(p=>context.lineTo(...p));context.stroke();
}
function drawPaper() {
 ctx.clearRect(0,0,900,520);strokes.forEach(s=>drawStroke(s));if(activeStroke)drawStroke(activeStroke);
 $('#sketch-prompt').hidden=strokes.length>0||!!activeStroke;
 $('#sketch-undo').disabled=!strokes.length;
 $('#sketch-redo').disabled=!redo.length;
}
function saveDrawing(){try{localStorage.setItem(storageKey,JSON.stringify(strokes));$('#sketch-status').textContent='Saved only on this device.';}catch{$('#sketch-status').textContent='Download your drawing to keep it.';}}
function point(event){const r=canvas.getBoundingClientRect();return [Math.max(0,Math.min(900,(event.clientX-r.left)*900/r.width)),Math.max(0,Math.min(520,(event.clientY-r.top)*520/r.height))];}
canvas.addEventListener('pointerdown',event=>{
 if(event.button!==0||activeStroke)return;
 event.preventDefault();canvas.setPointerCapture(event.pointerId);
 activeStroke={color:ink,width:Number($('#pen-size').value),points:[point(event)],pointer:event.pointerId};drawPaper();
});
canvas.addEventListener('pointermove',event=>{
 if(!activeStroke||activeStroke.pointer!==event.pointerId)return;
 if(activeStroke.points.length<20000)activeStroke.points.push(point(event));drawPaper();
});
function finishStroke(event){if(!activeStroke||event.pointerId!==activeStroke.pointer)return;const {pointer,...stroke}=activeStroke;strokes.push(stroke);if(strokes.length>500)strokes.shift();activeStroke=null;redo=[];drawPaper();saveDrawing();}
canvas.addEventListener('pointerup',finishStroke);canvas.addEventListener('pointercancel',finishStroke);canvas.addEventListener('lostpointercapture',finishStroke);
$$('[data-ink]').forEach(button=>button.addEventListener('click',()=>{ink=button.dataset.ink;$$('[data-ink]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));}));
$('#sketch-undo').addEventListener('click',()=>{if(strokes.length)redo.push(strokes.pop());drawPaper();saveDrawing();});
$('#sketch-redo').addEventListener('click',()=>{if(redo.length)strokes.push(redo.pop());drawPaper();saveDrawing();});
$('#sketch-clear').addEventListener('click',()=>{redo.push(...strokes.slice().reverse());strokes=[];drawPaper();saveDrawing();});
canvas.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();$(event.shiftKey?'#sketch-redo':'#sketch-undo').click();}});
function download(blob,filename){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
$('#save-png').addEventListener('click',()=>{const out=document.createElement('canvas');out.width=900;out.height=520;const c=out.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,900,520);strokes.forEach(s=>drawStroke(s,c));out.toBlob(blob=>{if(blob)download(blob,'a-little-doodle.png');});});
$('#save-svg').addEventListener('click',()=>{
 const marks=strokes.map(s=>s.points.length===1?`<circle cx="${s.points[0][0]}" cy="${s.points[0][1]}" r="${s.width/2}" fill="${s.color}"/>`:`<polyline points="${s.points.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${s.color}" stroke-width="${s.width}" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
 download(new Blob([`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 520"><rect width="900" height="520" fill="white"/>${marks}</svg>`],{type:'image/svg+xml'}),'a-little-doodle.svg');
});
drawPaper();

// A real image-to-text renderer. User-selected files are decoded locally, never sent anywhere.
let portraitImage=null,asciiText='';
function fitAscii(){const pre=$('#ascii-output'),frame=$('.ascii-frame');if(!frame.clientWidth)return;const cols=Number($('#ascii-detail').value);pre.style.fontSize=`${Math.min((frame.clientWidth-28)/(cols*.61),(frame.clientHeight-45)/Math.round(cols*.62))}px`;}
function renderAscii(){
 const cols=Number($('#ascii-detail').value),rows=Math.round(cols*.62),ramp=' .,:;irsXA253hMHGS#9B&@';
 const sample=document.createElement('canvas');sample.width=cols;sample.height=rows;const c=sample.getContext('2d',{willReadFrequently:true});
 if(portraitImage){
  c.fillStyle='#fff';c.fillRect(0,0,cols,rows);
  const targetRatio=cols/(rows*2),sourceRatio=portraitImage.width/portraitImage.height;
  const sw=sourceRatio>targetRatio?portraitImage.height*targetRatio:portraitImage.width,sh=sourceRatio>targetRatio?portraitImage.height:portraitImage.width/targetRatio;
  c.drawImage(portraitImage,(portraitImage.width-sw)/2,(portraitImage.height-sh)/2,sw,sh,0,0,cols,rows);
 } else {
  c.fillStyle='white';c.fillRect(0,0,cols,rows);c.fillStyle='#111';c.beginPath();
  for(let i=0;i<8;i++){const a=i*Math.PI/4-Math.PI/2,r=i%2?cols*.07:cols*.34;c.lineTo(cols/2+Math.cos(a)*r,rows/2+Math.sin(a)*r*.57);}c.closePath();c.fill();
 }
 const pixels=c.getImageData(0,0,cols,rows).data;const lines=[];
 for(let y=0;y<rows;y++){let line='';for(let x=0;x<cols;x++){const i=(y*cols+x)*4;const light=(pixels[i]*.2126+pixels[i+1]*.7152+pixels[i+2]*.0722)/255;line+=ramp[Math.round((1-light)*(ramp.length-1))];}lines.push(line);}
 asciiText=lines.join('\n');$('#ascii-output').textContent=asciiText;fitAscii();
}
async function loadPortrait(url,local=false){
 const img=new Image();if(!local)img.crossOrigin='anonymous';
 try{img.src=url;await img.decode();portraitImage=img;renderAscii();$('#ascii-caption').textContent='a face, made of little marks';$('#portrait-status').textContent='Photos stay in your browser. Nothing is uploaded.';}catch{$('#portrait-status').textContent='This image could not be opened. Try a JPG, PNG or WebP.';}finally{if(local)URL.revokeObjectURL(url);}
}
$('#portrait-input').addEventListener('change',event=>{const file=event.target.files[0];if(!file)return;if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>15*1024*1024){$('#portrait-status').textContent='Choose a JPG, PNG or WebP under 15 MB.';return;}loadPortrait(URL.createObjectURL(file),true);});
$('#ascii-detail').addEventListener('input',renderAscii);$('#ascii-save').addEventListener('click',()=>download(new Blob([asciiText],{type:'text/plain'}),'a-portrait-in-punctuation.txt'));
new ResizeObserver(fitAscii).observe($('.ascii-frame'));
renderAscii();if($('.ascii-frame').dataset.portrait)loadPortrait($('.ascii-frame').dataset.portrait);

$('#bag-toggle').addEventListener('click',()=>{const open=$('#bag-contents').hidden;$('#bag-contents').hidden=!open;$('#bag-toggle').setAttribute('aria-expanded',String(open));$('#bag-toggle').setAttribute('aria-label',open?'Close my bag':'Open my bag');$('#bag-action').textContent=open?'put it all back ↑':'click to unpack ↓';});
$$('.bag-object').forEach(button=>button.addEventListener('click',()=>{$$('.bag-object').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));$('#bag-item-name').textContent=button.dataset.name;$('#bag-item-note').textContent=button.dataset.bagNote;}));

const postcards=$$('[data-card]');let cardIndex=0,cardBusy=false,swipeStart=null;
function changeCard(direction){
 if(cardBusy||postcards.length<2)return;cardBusy=true;const old=postcards[cardIndex];
 old.classList.add(direction>0?'is-leaving-next':'is-leaving-prev');
 setTimeout(()=>{old.hidden=true;old.classList.remove('is-leaving-next','is-leaving-prev','is-arriving');cardIndex=(cardIndex+direction+postcards.length)%postcards.length;const next=postcards[cardIndex];next.hidden=false;next.classList.add('is-arriving');$('#travel-count').textContent=`${String(cardIndex+1).padStart(2,'0')} / ${String(postcards.length).padStart(2,'0')}`;setTimeout(()=>{next.classList.remove('is-arriving');cardBusy=false;},reducedMotion.matches?0:330);},reducedMotion.matches?0:230);
}
$('#travel-prev').addEventListener('click',()=>changeCard(-1));$('#travel-next').addEventListener('click',()=>changeCard(1));
$('.postcard-deck').addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();changeCard(event.key==='ArrowRight'?1:-1);}});
$('.postcard-deck').addEventListener('pointerdown',event=>{swipeStart=event.clientX;});
$('.postcard-deck').addEventListener('pointerup',event=>{if(swipeStart!==null&&Math.abs(event.clientX-swipeStart)>45)changeCard(event.clientX<swipeStart?1:-1);swipeStart=null;});
$('.postcard-deck').addEventListener('pointercancel',()=>{swipeStart=null;});
const dialog=$('#photo-dialog');$$('[data-photo]').forEach(button=>button.addEventListener('click',()=>{const image=button.querySelector('img');$('#photo-large').src=image.src;$('#photo-large').alt=image.alt;$('#photo-caption').textContent=button.querySelector('span').textContent;dialog.showModal();}));
$('#photo-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',event=>{if(event.target===dialog){const b=dialog.getBoundingClientRect();if(event.clientX<b.left||event.clientX>b.right||event.clientY<b.top||event.clientY>b.bottom)dialog.close();}});
openRoom();
