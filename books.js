const volumes = [...document.querySelectorAll('.book-slot')];
const previous = document.getElementById('previous-book');
const next = document.getElementById('next-book');
let selection = 0;
document.querySelector('.shelf-controls').hidden = false;
function selectBook(index, focus = false) {
 selection = Math.max(0, Math.min(volumes.length - 1, index));
 volumes.forEach((volume, i) => {
   volume.classList.toggle('selected', i === selection);
   volume.setAttribute('aria-pressed', String(i === selection));
 });
 const selected = volumes[selection];
 document.getElementById('book-title').textContent = selected.querySelector('.book-front strong').textContent;
 document.getElementById('book-author').textContent = selected.querySelector('.book-front small').textContent;
 document.getElementById('book-count').textContent = `${String(selection + 1).padStart(2,'0')} / ${String(volumes.length).padStart(2,'0')}`;
 previous.disabled = selection === 0;
 next.disabled = selection === volumes.length - 1;
 if (focus) selected.focus({preventScroll:true});
 selected.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block:'nearest', inline:'nearest'});
}
volumes.forEach((volume, i) => {
 volume.addEventListener('click', () => selectBook(i));
 volume.addEventListener('keydown', event => {
   if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
     event.preventDefault(); selectBook(selection + (event.key === 'ArrowRight' ? 1 : -1), true);
   }
 });
});
previous.addEventListener('click', () => selectBook(selection - 1));
next.addEventListener('click', () => selectBook(selection + 1));
