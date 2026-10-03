const volumes=[...document.querySelectorAll('.book-slot')];
const byId=id=>document.getElementById(id);
const previous=byId('previous-book'),next=byId('next-book'),stage=document.querySelector('.shelf-stage');
const dialog=byId('book-inspection'),motion=matchMedia('(prefers-reduced-motion: reduce)');
let selection=0,revealTimer;
function revealBook(){
 const bounds=stage.getBoundingClientRect(),book=volumes[selection].getBoundingClientRect(),padding=25;
 const delta=book.left<bounds.left+padding?book.left-bounds.left-padding:book.right>bounds.right-padding?book.right-bounds.right+padding:0;
 if(delta)stage.scrollTo({left:stage.scrollLeft+delta,behavior:motion.matches?'instant':'smooth'});
}
function inspect(){
 const selected=volumes[selection],cover=byId('inspection-cover');
 cover.replaceChildren(selected.querySelector('.book-front').cloneNode(true));
 cover.style.setProperty('--cover',selected.style.getPropertyValue('--cover'));cover.style.setProperty('--book-ink',selected.style.getPropertyValue('--book-ink'));
 ['title','author','count'].forEach(key=>byId(`inspection-${key}`).textContent=byId(`book-${key}`).textContent);
 byId('inspection-link').href=`https://www.goodreads.com/search?q=${encodeURIComponent(byId('book-title').textContent+' '+byId('book-author').textContent)}`;
 byId('inspect-previous').disabled=selection===0;byId('inspect-next').disabled=selection===volumes.length-1;
}
function selectBook(index,focus=false){
 selection=Math.max(0,Math.min(volumes.length-1,index));
 volumes.forEach((v,i)=>{v.classList.toggle('selected',i===selection);v.setAttribute('aria-pressed',String(i===selection));});
 const selected=volumes[selection];
 byId('book-title').textContent=selected.querySelector('.book-front strong').textContent;
 byId('book-author').textContent=selected.querySelector('.book-front small').textContent;
 byId('book-count').textContent=`${String(selection+1).padStart(2,'0')} / ${String(volumes.length).padStart(2,'0')}`;
 previous.disabled=selection===0;next.disabled=selection===volumes.length-1;
 if(focus)selected.focus({preventScroll:true});
 clearTimeout(revealTimer);revealTimer=setTimeout(revealBook,motion.matches?0:620);
 if(dialog.open)inspect();
}
document.querySelector('.shelf-controls').hidden=false;byId('inspect-book').hidden=false;
volumes.forEach((v,i)=>{v.addEventListener('click',()=>selectBook(i));v.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();selectBook(selection+(event.key==='ArrowRight'?1:-1),true);}});});
previous.addEventListener('click',()=>selectBook(selection-1));next.addEventListener('click',()=>selectBook(selection+1));
byId('inspect-book').addEventListener('click',()=>{inspect();dialog.showModal();});byId('close-inspection').addEventListener('click',()=>dialog.close());
byId('inspect-previous').addEventListener('click',()=>selectBook(selection-1));byId('inspect-next').addEventListener('click',()=>selectBook(selection+1));
dialog.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();selectBook(selection+(event.key==='ArrowRight'?1:-1));}});
dialog.addEventListener('click',event=>{if(event.target===dialog){const b=dialog.getBoundingClientRect();if(event.clientX<b.left||event.clientX>b.right||event.clientY<b.top||event.clientY>b.bottom)dialog.close();}});
