const record = document.getElementById('record');
const toggle = document.getElementById('spin-toggle');
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
const choices = [...document.querySelectorAll('.album-choice')];
const audio = document.getElementById('album-audio');
const audioToggle = document.getElementById('audio-toggle');
const status = document.getElementById('audio-status');
let playbackRequest = 0;
let spinning = !motion.matches;
function render() {
 record.classList.toggle('spinning', spinning);
 toggle.textContent = spinning ? 'Pause rotation' : 'Spin the record';
}
toggle.hidden = false;
audioToggle.hidden = false;
toggle.addEventListener('click', () => { spinning = !spinning; render(); });
motion.addEventListener('change', () => { spinning = !motion.matches; render(); });
function renderAudio() {
 audioToggle.textContent = audio.paused ? 'Play preview' : 'Pause preview';
}
async function playPreview() {
 const request = ++playbackRequest;
 status.textContent = 'Song previews · Apple Music';
 audioToggle.textContent = 'Loading…';
 try {
   await audio.play();
   if (request === playbackRequest) renderAudio();
 } catch {
   if (request !== playbackRequest) return;
   status.textContent = 'Preview unavailable. Listen on Apple Music.';
   renderAudio();
 }
}
function selectAlbum(choice) {
 playbackRequest++;
 audio.pause();
 const album = choice.dataset;
 choices.forEach(button => button.setAttribute('aria-pressed', String(button === choice)));
 document.getElementById('album-title').textContent = album.title;
 document.getElementById('album-artist').textContent = album.artist;
 document.getElementById('track-name').textContent = album.track;
 const cover = document.getElementById('record-cover');
 cover.src = album.cover;
 cover.alt = `${album.title} album cover`;
 record.setAttribute('aria-label', `A vinyl record with the ${album.title} album cover at its centre`);
 document.getElementById('listen-link').href = album.url;
 audio.src = album.preview;
 audio.load();
 playPreview();
}
choices.forEach((choice, index) => {
 choice.addEventListener('click', () => selectAlbum(choice));
 choice.addEventListener('keydown', event => {
   const direction = {ArrowLeft:-1, ArrowUp:-1, ArrowRight:1, ArrowDown:1}[event.key];
   if (!direction) return;
   event.preventDefault();
   choices[(index + direction + choices.length) % choices.length].focus();
 });
});
audioToggle.addEventListener('click', () => {
 if (audio.paused) playPreview();
 else { playbackRequest++; audio.pause(); }
});
audio.addEventListener('play', renderAudio);
audio.addEventListener('pause', renderAudio);
audio.addEventListener('ended', renderAudio);
audio.addEventListener('error', () => {
 status.textContent = 'Preview unavailable. Listen on Apple Music.';
 renderAudio();
});
render();
