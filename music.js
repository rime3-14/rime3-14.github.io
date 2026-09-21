const record = document.getElementById('record');
const toggle = document.getElementById('spin-toggle');
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
let spinning = !motion.matches;
function render() {
 record.classList.toggle('spinning', spinning);
 toggle.textContent = spinning ? 'Pause rotation' : 'Spin the record';
}
toggle.hidden = false;
toggle.addEventListener('click', () => { spinning = !spinning; render(); });
motion.addEventListener('change', () => { spinning = !motion.matches; render(); });
render();
