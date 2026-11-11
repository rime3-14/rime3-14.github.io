(() => {
const data = JSON.parse(document.getElementById('interests-data').textContent);
const $ = id => document.getElementById(id);
const brain = $('brain'); brain.hidden = false;
const canvas = $('interest-map'), ctx = canvas.getContext('2d');
const card = $('map-card'), search = $('map-search'), results = $('map-results');
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const groups = data.groups.map(g => {
  const h = g.color.replace('#', ''), n = parseInt(h, 16);
  return { ...g, rgb: [(n >> 16) & 255, (n >> 8) & 255, n & 255], x: 0, y: 0, spread: 0 };
});
const rgba = (rgb, a) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;

/* ---------- graph ---------- */
const nodes = data.nodes.map((n, i) => ({ ...n, i, nb: new Set(), links: [], x: 0, y: 0, vx: 0, vy: 0,
  vis: 1, la: 0, grow: 1, phase: Math.random() * Math.PI * 2 }));
const byId = new Map(nodes.map(n => [n.id, n]));
const links = data.edges.map(([a, b, note]) => ({ a: byId.get(a), b: byId.get(b), note })).filter(l => l.a && l.b && l.a !== l.b);
for (const l of links) {
  l.a.nb.add(l.b); l.b.nb.add(l.a); l.a.links.push(l); l.b.links.push(l);
  l.cross = l.a.group !== l.b.group;
  l.bend = ((l.a.i * 31 + l.b.i * 17) % 2 ? 1 : -1) * (l.cross ? .1 : .16);
}
for (const n of nodes) {
  n.deg = n.nb.size;
  n.r = n.hub ? 9 : 2.6 + Math.sqrt(n.deg) * 1.25;
  n.short = n.label.length > 30 ? n.label.slice(0, 28).trimEnd() + '…' : n.label;
}

/* ---------- layout: clusters arranged like lobes, then relaxed by forces ---------- */
const G = groups.length, ring = 470, box0 = brain.getBoundingClientRect(), tall = box0.height > box0.width * 1.1;
const [rx, ry] = tall ? [ring * .55, ring * 1.3] : [ring * 1.18, ring * .82];
groups.forEach((g, k) => { const a = k / G * Math.PI * 2 - Math.PI / 2; g.cx = Math.cos(a) * rx; g.cy = Math.sin(a) * ry; });
const seeded = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(7);
groups.forEach((g, k) => {
  nodes.filter(n => n.group === k).forEach((n, i) => {
    if (n.hub) { n.x = g.cx; n.y = g.cy; return; }
    const a = i * 2.39996, r = 30 + Math.sqrt(i) * 26;
    n.x = g.cx + Math.cos(a) * r + seeded() * 6; n.y = g.cy + Math.sin(a) * r + seeded() * 6;
  });
});
let alpha = 1;
function tick() {
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i];
    for (let j = i + 1; j < nodes.length; j++) {
      const b = nodes[j]; let dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy || .01;
      if (d2 > 160000) continue;
      const same = a.group === b.group, s = (a.hub || b.hub ? 900 : 420) * (same ? 1 : 1.6) * alpha / d2;
      a.vx -= dx * s; a.vy -= dy * s; b.vx += dx * s; b.vy += dy * s;
      const min = a.r + b.r + 16;
      if (d2 < min * min) { const d = Math.sqrt(d2), p = (min - d) / d * .5; a.x -= dx * p * .5; a.y -= dy * p * .5; b.x += dx * p * .5; b.y += dy * p * .5; }
    }
  }
  for (const l of links) {
    const { a, b } = l, dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
    const rest = l.cross ? 260 : (a.hub || b.hub ? 88 : 62), k = l.cross ? .012 : .1;
    const f = (d - rest) / d * k * alpha;
    a.vx += dx * f; a.vy += dy * f; b.vx -= dx * f; b.vy -= dy * f;
  }
  for (const n of nodes) {
    const g = groups[n.group], pull = (n.hub ? .09 : .028) * alpha;
    n.vx += (g.cx - n.x) * pull; n.vy += (g.cy - n.y) * pull;
    if (n.fx != null) { n.x = n.fx; n.y = n.fy; n.vx = n.vy = 0; continue; }
    n.vx *= .55; n.vy *= .55; n.x += n.vx; n.y += n.vy;
  }
}
for (let i = 0; i < 320; i++) { tick(); alpha = Math.max(.02, alpha * .985); }
alpha = 0;
function regions() {
  for (const g of groups) { g.n = 0; g.x = 0; g.y = 0; g.spread = 0; }
  for (const n of nodes) { const g = groups[n.group]; g.n++; g.x += n.x; g.y += n.y; }
  for (const g of groups) { g.x /= g.n || 1; g.y /= g.n || 1; }
  for (const n of nodes) { const g = groups[n.group]; g.spread = Math.max(g.spread, Math.hypot(n.x - g.x, n.y - g.y)); }
}
regions();

/* ---------- camera ---------- */
let W = 0, H = 0, dpr = 1;
const cam = { x: 0, y: 0, k: .5 }, goal = { x: 0, y: 0, k: .5 };
let anchor = null, glide = { x: 0, y: 0 };
const mobile = () => W < 700;
const toScreen = (x, y) => [(x - cam.x) * cam.k + W / 2, (y - cam.y) * cam.k + H / 2];
const toWorld = (sx, sy) => [(sx - W / 2) / cam.k + cam.x, (sy - H / 2) / cam.k + cam.y];
const clampK = k => Math.min(3.2, Math.max(.15, k));
function frameBox(list, pad = 1) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const n of list) { x0 = Math.min(x0, n.x); y0 = Math.min(y0, n.y); x1 = Math.max(x1, n.x); y1 = Math.max(y1, n.y); }
  const sideW = !mobile() && active ? 330 : 0, bottom = mobile() ? Math.min(H * .42, card.offsetHeight) + 24 : 60, top = mobile() ? 110 : 70;
  const aw = W - sideW - 60, ah = H - top - bottom;
  const k = clampK(Math.min(aw / (x1 - x0 + 160), ah / (y1 - y0 + 120)) * pad);
  anchor = null; glide = { x: 0, y: 0 };
  goal.k = k;
  goal.x = (x0 + x1) / 2 + (sideW / 2) / k;
  goal.y = (y0 + y1) / 2 - (top - bottom) / 2 / k;
}
function fitAll(instant) { frameBox(nodes, 1); if (instant) Object.assign(cam, goal); }
function zoomBy(f, sx = W / 2, sy = H / 2) {
  const [wx, wy] = toWorld(sx, sy);
  anchor = { sx, sy, wx, wy }; goal.k = clampK(goal.k * f);
}

/* ---------- state ---------- */
let active = null, hover = null, query = '', groupFocus = null, trail = [], t0 = performance.now(), last = t0;
const pulses = [];
function fire(from, link, delay = 0, strength = 1) { if (!calm) pulses.push({ link, from, t: -delay, dur: 900 + Math.random() * 500, strength }); }

function select(n, { fly = true } = {}) {
  if (!n) return;
  active = n; query = ''; search.value = ''; closeResults(); groupFocus = null;
  trail = trail.filter(t => t !== n); trail.push(n); if (trail.length > 6) trail.shift();
  renderCard();
  if (fly) frameBox([n, ...n.nb], .92);
  n.links.forEach((l, i) => fire(n, l, i * 40, 1.4));
  hint.classList.add('gone');
}
function clear() { active = null; renderCard(); }

/* ---------- card ---------- */
const closeIcon = $('icon-close').innerHTML;
function chip(n) {
  const b = document.createElement('button');
  b.style.setProperty('--topic', groups[n.group].color);
  b.innerHTML = '<span class="dot"></span>'; b.append(n.label);
  b.onclick = () => select(n);
  b.onmouseenter = () => { hover = n; }; b.onmouseleave = () => { if (hover === n) hover = null; };
  return b;
}
function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }
function renderCard() {
  card.replaceChildren(); card.classList.toggle('intro', !active);
  if (!active) {
    card.append(el('p', 'card-topic', 'Follow a thread'), el('h2', '', 'Everything connects.'),
      el('p', 'note', 'Each light is something I keep returning to; each thread, an association. Pick one and follow where it leads.'));
    if (!mobile()) {
      card.append(el('h3', '', 'Start somewhere'));
      const c = el('div', 'chips');
      ['Albert Camus', 'Abstraction', 'Glory', 'Objects as a concept', 'Agency'].map(id => byId.get(id)).filter(Boolean).forEach(n => c.append(chip(n)));
      card.append(c);
    }
    return;
  }
  const n = active, g = groups[n.group];
  const top = el('div', 'card-top'), topic = el('button', 'card-topic');
  topic.style.setProperty('--topic', g.color); topic.innerHTML = '<span class="dot"></span>'; topic.append(g.label);
  const hub = nodes.find(m => m.hub && m.group === n.group);
  topic.onclick = () => select(hub);
  const x = el('button', 'card-close'); x.innerHTML = closeIcon; x.setAttribute('aria-label', 'Close'); x.onclick = clear;
  top.append(topic, x); card.append(top, el('h2', '', n.label));
  if (n.note) card.append(el('p', 'note', n.note));
  if (n.url) {
    const a = el('a', 'card-visit', n.url.startsWith('http') ? 'Read / visit ↗' : 'Explore in my nook →'); a.href = n.url;
    if (n.url.startsWith('http')) { a.target = '_blank'; a.rel = 'noopener'; }
    card.append(a);
  }
  const nb = [...n.nb].sort((a, b) => (b.hub - a.hub) || (a.group === n.group) - (b.group === n.group) || b.deg - a.deg);
  card.append(el('h3', '', `Connected to · ${nb.length}`));
  const c = el('div', 'chips'); nb.forEach(m => c.append(chip(m))); card.append(c);
  if (trail.length > 1) {
    card.append(el('h3', '', 'Your path'));
    const t = el('div', 'trail');
    trail.forEach((m, i) => { if (i) t.append(el('span', '', '→')); const b = el('button', '', m.short); b.onclick = () => select(m); t.append(b); });
    card.append(t);
  }
  card.scrollTop = 0;
}

/* ---------- search ---------- */
let found = [], cursor = 0;
function closeResults() { results.hidden = true; search.setAttribute('aria-expanded', 'false'); }
function renderResults() {
  results.replaceChildren();
  if (!query) { closeResults(); return; }
  found = nodes.filter(n => n.label.toLowerCase().includes(query))
    .sort((a, b) => a.label.toLowerCase().indexOf(query) - b.label.toLowerCase().indexOf(query) || b.deg - a.deg).slice(0, 8);
  cursor = Math.min(cursor, Math.max(0, found.length - 1));
  if (!found.length) results.append(el('li', 'empty', 'No thread by that name yet.'));
  found.forEach((n, i) => {
    const li = el('li'); li.setAttribute('role', 'option'); li.setAttribute('aria-selected', i === cursor);
    li.style.setProperty('--topic', groups[n.group].color); li.innerHTML = '<span class="dot"></span>';
    li.append(n.label, el('small', '', groups[n.group].label));
    li.onpointerdown = e => { e.preventDefault(); select(n); };
    li.onmouseenter = () => { cursor = i; hover = n; renderResults(); };
    results.append(li);
  });
  results.hidden = false; search.setAttribute('aria-expanded', 'true');
}
search.addEventListener('input', () => { query = search.value.toLowerCase().trim(); cursor = 0; renderResults(); });
search.addEventListener('keydown', e => {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); cursor = (cursor + (e.key === 'ArrowDown' ? 1 : -1) + found.length) % (found.length || 1); renderResults(); }
  else if (e.key === 'Enter' && found[cursor]) { e.preventDefault(); select(found[cursor]); search.blur(); }
  else if (e.key === 'Escape') { search.value = ''; query = ''; renderResults(); search.blur(); }
});
search.addEventListener('blur', () => setTimeout(closeResults, 120));
search.addEventListener('focus', () => query && renderResults());
document.addEventListener('keydown', e => {
  if (e.key === '/' && document.activeElement !== search && !/input|textarea/i.test(document.activeElement.tagName)) {
    const r = brain.getBoundingClientRect(); if (r.bottom > 0 && r.top < innerHeight) { e.preventDefault(); search.focus(); }
  }
  if (e.key === 'Escape' && active && document.activeElement !== search) clear();
});
canvas.addEventListener('keydown', e => {
  const step = 60 / cam.k, keys = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
  if (keys[e.key]) { e.preventDefault(); anchor = null; goal.x += keys[e.key][0]; goal.y += keys[e.key][1]; }
  if (e.key === '+' || e.key === '=') zoomBy(1.3);
  if (e.key === '-') zoomBy(1 / 1.3);
});

/* ---------- topics, controls, index ---------- */
document.querySelectorAll('[data-topic]').forEach(b => {
  const k = +b.dataset.topic;
  b.onclick = () => select(nodes.find(n => n.hub && n.group === k));
  b.onmouseenter = () => { groupFocus = k; b.classList.add('on'); };
  b.onmouseleave = () => { groupFocus = null; b.classList.remove('on'); };
});
$('zoom-in').onclick = () => zoomBy(1.4);
$('zoom-out').onclick = () => zoomBy(1 / 1.4);
$('map-reset').onclick = () => { clear(); fitAll(); };
document.querySelectorAll('[data-interest]').forEach(b => b.onclick = () => {
  brain.scrollIntoView({ block: 'center', behavior: calm ? 'auto' : 'smooth' }); select(byId.get(b.dataset.interest));
});

/* ---------- pointer: pan, pinch, drag nodes ---------- */
const pointers = new Map(); let press = null, pinch = null;
const hint = brain.querySelector('.brain-hint');
function pick(sx, sy) {
  let best = null, bd = Infinity;
  for (const n of nodes) {
    const [x, y] = toScreen(n.dx, n.dy), d = Math.hypot(x - sx, y - sy), r = Math.max(n.r * Math.sqrt(cam.k) * 1.2, 9) + 5;
    if (d < r && d < bd && n.vis > .3) { best = n; bd = d; }
  }
  return best;
}
const local = e => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
canvas.addEventListener('pointerdown', e => {
  canvas.setPointerCapture(e.pointerId); canvas.focus({ preventScroll: true });
  const [sx, sy] = local(e); pointers.set(e.pointerId, { sx, sy });
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    pinch = { d: Math.hypot(a.sx - b.sx, a.sy - b.sy) }; if (press?.node) press.node.fx = null; press = null; return;
  }
  press = { sx, sy, node: pick(sx, sy), moved: false, t: performance.now() };
  glide = { x: 0, y: 0 }; anchor = null;
});
canvas.addEventListener('pointermove', e => {
  const [sx, sy] = local(e);
  if (!pointers.has(e.pointerId)) {
    if (e.pointerType === 'mouse') { hover = pick(sx, sy); canvas.classList.toggle('on-node', !!hover); }
    return;
  }
  const prev = pointers.get(e.pointerId); pointers.set(e.pointerId, { sx, sy });
  if (pinch && pointers.size === 2) {
    const [a, b] = [...pointers.values()], d = Math.hypot(a.sx - b.sx, a.sy - b.sy);
    const [wx, wy] = toWorld((a.sx + b.sx) / 2, (a.sy + b.sy) / 2);
    cam.k = goal.k = clampK(cam.k * d / pinch.d); pinch.d = d;
    cam.x = goal.x = wx - ((a.sx + b.sx) / 2 - W / 2) / cam.k; cam.y = goal.y = wy - ((a.sy + b.sy) / 2 - H / 2) / cam.k;
    return;
  }
  if (!press) return;
  if (!press.moved && Math.hypot(sx - press.sx, sy - press.sy) > 4) { press.moved = true; canvas.classList.add('dragging'); hint.classList.add('gone'); }
  if (!press.moved) return;
  if (press.node) {
    const [wx, wy] = toWorld(sx, sy); press.node.fx = wx; press.node.fy = wy; alpha = Math.max(alpha, .35); hover = press.node;
  } else {
    const dx = (sx - prev.sx) / cam.k, dy = (sy - prev.sy) / cam.k;
    cam.x -= dx; cam.y -= dy; goal.x = cam.x; goal.y = cam.y; glide = { x: -dx, y: -dy }; press.lastMove = performance.now();
  }
});
function release(e) {
  pointers.delete(e.pointerId); canvas.classList.remove('dragging');
  if (pinch) { if (pointers.size < 2) pinch = null; press = null; return; }
  if (!press) return;
  if (press.node) { press.node.fx = press.node.fy = null; alpha = Math.max(alpha, .2); }
  if (!press.moved && e.type === 'pointerup') { if (press.node) select(press.node); else if (active) clear(); }
  if (!press.moved || press.node || calm || performance.now() - press.lastMove > 80) glide = { x: 0, y: 0 };
  press = null;
}
canvas.addEventListener('pointerup', release); canvas.addEventListener('pointercancel', release);
canvas.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && !press) { hover = null; canvas.classList.remove('on-node'); } });
canvas.addEventListener('wheel', e => {
  e.preventDefault(); const [sx, sy] = local(e);
  if (Math.abs(e.deltaY) >= Math.abs(e.deltaX) || e.ctrlKey) zoomBy(Math.exp(-e.deltaY * (e.ctrlKey ? .012 : .0016)), sx, sy);
  else { anchor = null; goal.x += e.deltaX / cam.k; }
  hint.classList.add('gone');
}, { passive: false });

/* ---------- drawing ---------- */
const labelW = new Map();
function measure(n, font) { const key = font + n.i; if (!labelW.has(key)) { ctx.font = font; labelW.set(key, ctx.measureText(n.short).width); } return labelW.get(key); }
document.fonts?.ready.then(() => labelW.clear());
function resize() {
  const r = brain.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1);
  const first = !W; W = r.width; H = r.height;
  canvas.width = W * dpr; canvas.height = H * dpr;
  if (first) { renderCard(); fitAll(true); cam.k = goal.k * .82; } // gentle zoom-in on arrival
}
function curve(l) {
  const [ax, ay] = toScreen(l.a.dx, l.a.dy), [bx, by] = toScreen(l.b.dx, l.b.dy);
  const mx = (ax + bx) / 2, my = (ay + by) / 2;
  return [ax, ay, mx - (by - ay) * l.bend, my + (bx - ax) * l.bend, bx, by];
}
function along(c, t, from) {
  if (from) t = 1 - t;
  const u = 1 - t; return [u * u * c[0] + 2 * u * t * c[2] + t * t * c[4], u * u * c[1] + 2 * u * t * c[3] + t * t * c[5]];
}
function frame(now) {
  const dt = Math.min(64, now - last); last = now; const time = now - t0, ease = 1 - Math.exp(-dt / 140), fast = 1 - Math.exp(-dt / 90);
  if (alpha > .004) { tick(); alpha *= .97; regions(); } else alpha = 0;

  // camera
  if (glide.x || glide.y) {
    if (!press) { goal.x += glide.x; goal.y += glide.y; cam.x += glide.x; cam.y += glide.y; glide.x *= .92; glide.y *= .92; if (Math.hypot(glide.x, glide.y) * cam.k < .1) glide = { x: 0, y: 0 }; }
  }
  cam.k += (goal.k - cam.k) * (calm ? 1 : ease);
  if (anchor) { cam.x = goal.x = anchor.wx - (anchor.sx - W / 2) / cam.k; cam.y = goal.y = anchor.wy - (anchor.sy - H / 2) / cam.k; if (Math.abs(goal.k - cam.k) < .0005) anchor = null; }
  else { cam.x += (goal.x - cam.x) * (calm ? 1 : ease); cam.y += (goal.y - cam.y) * (calm ? 1 : ease); }

  // emphasis
  const focus = hover || active, ring = new Set();
  if (focus) { ring.add(focus); focus.nb.forEach(n => ring.add(n)); }
  for (const n of nodes) {
    let v = 1;
    if (focus) v = ring.has(n) ? 1 : (active && hover && (n === active || active.nb.has(n))) ? .45 : .1;
    else if (query) v = n.label.toLowerCase().includes(query) ? 1 : .1;
    else if (groupFocus != null) v = n.group === groupFocus ? 1 : .12;
    n.vis += (v - n.vis) * fast;
    n.grow += ((n === focus ? 1.5 : n === active ? 1.35 : 1) - n.grow) * fast;
    const b = calm ? 0 : 1.8;
    n.dx = n.x + Math.sin(time / 1700 + n.phase) * b; n.dy = n.y + Math.cos(time / 2100 + n.phase * 1.3) * b;
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);

  // drifting dot grid, a little parallax for depth
  const gap = 34 * cam.k * .7;
  if (gap > 9) {
    ctx.fillStyle = 'rgba(70,55,85,.07)';
    const ox = (-cam.x * cam.k * .7 + W / 2) % gap, oy = (-cam.y * cam.k * .7 + H / 2) % gap;
    for (let x = ox; x < W; x += gap) for (let y = oy; y < H; y += gap) ctx.fillRect(x, y, 1.2, 1.2);
  }

  // soft regions behind each cluster
  ctx.globalCompositeOperation = 'multiply';
  groups.forEach((g, k) => {
    const [x, y] = toScreen(g.x, g.y), r = (g.spread + 90) * cam.k;
    const on = groupFocus === k || active?.group === k ? 1 : (focus || query || groupFocus != null ? .35 : .8);
    g.glow = (g.glow ?? on) + (on - (g.glow ?? on)) * fast;
    const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, rgba(g.rgb, .13 * g.glow)); grd.addColorStop(.55, rgba(g.rgb, .06 * g.glow)); grd.addColorStop(1, rgba(g.rgb, 0));
    ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  });
  ctx.globalCompositeOperation = 'source-over';

  // threads
  ctx.lineCap = 'round';
  const lit = [];
  for (const l of links) {
    const on = focus && (l.a === focus || l.b === focus);
    if (on) { lit.push(l); continue; }
    const v = Math.min(l.a.vis, l.b.vis);
    const c = curve(l);
    ctx.strokeStyle = l.cross ? `rgba(95,80,105,${.16 * v})` : rgba(groups[l.a.group].rgb, .28 * v);
    ctx.lineWidth = (l.cross ? .8 : 1) * Math.min(1.4, Math.max(.6, Math.sqrt(cam.k)));
    ctx.beginPath(); ctx.moveTo(c[0], c[1]); ctx.quadraticCurveTo(c[2], c[3], c[4], c[5]); ctx.stroke();
  }
  for (const l of lit) {
    const c = curve(l);
    const grd = ctx.createLinearGradient(c[0], c[1], c[4], c[5]);
    grd.addColorStop(0, rgba(groups[l.a.group].rgb, .85)); grd.addColorStop(1, rgba(groups[l.b.group].rgb, .85));
    ctx.strokeStyle = grd; ctx.lineWidth = 1.7;
    ctx.beginPath(); ctx.moveTo(c[0], c[1]); ctx.quadraticCurveTo(c[2], c[3], c[4], c[5]); ctx.stroke();
  }

  // synapses: signals travelling along threads
  if (!calm) {
    if (Math.random() < dt / 380) { const l = links[(Math.random() * links.length) | 0]; fire(Math.random() < .5 ? l.a : l.b, l, 0, .55); }
    if (active && Math.random() < dt / 260) { const l = active.links[(Math.random() * active.links.length) | 0]; if (l) fire(active, l, 0, 1.2); }
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i]; p.t += dt; if (p.t < 0) continue;
      const t = p.t / p.dur; if (t >= 1) { pulses.splice(i, 1); continue; }
      const c = curve(p.link), [x, y] = along(c, t, p.from === p.link.b), v = Math.min(p.link.a.vis, p.link.b.vis);
      const to = p.from === p.link.a ? p.link.b : p.link.a, rgb = groups[to.group].rgb, a = Math.sin(t * Math.PI) * v * Math.min(1, p.strength);
      const rad = (1.4 + p.strength) * Math.min(1.3, Math.sqrt(cam.k) + .35);
      const grd = ctx.createRadialGradient(x, y, 0, x, y, rad * 3.5);
      grd.addColorStop(0, rgba(rgb, .28 * a)); grd.addColorStop(1, rgba(rgb, 0));
      ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(x, y, rad * 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${.95 * a})`; ctx.beginPath(); ctx.arc(x, y, rad * .9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = rgba(rgb, .9 * a); ctx.beginPath(); ctx.arc(x, y, rad * .55, 0, Math.PI * 2); ctx.fill();
    }
  }

  // neurons
  const sk = Math.min(1.6, Math.max(.7, Math.sqrt(cam.k * 1.6)));
  for (const n of nodes) {
    const [x, y] = toScreen(n.dx, n.dy); n.sx = x; n.sy = y;
    if (x < -60 || y < -60 || x > W + 60 || y > H + 60) { n.off = true; continue; } n.off = false;
    const rgb = groups[n.group].rgb, r = n.r * sk * n.grow; n.sr = r;
    if (n.hub || n === active || n === hover) {
      const breathe = n === active && !calm ? 1 + Math.sin(time / 500) * .12 : 1;
      const grd = ctx.createRadialGradient(x, y, r * .5, x, y, r * 4.2 * breathe);
      grd.addColorStop(0, rgba(rgb, .32 * n.vis)); grd.addColorStop(1, rgba(rgb, 0));
      ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(x, y, r * 4.2 * breathe, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = .25 + .75 * n.vis;
    ctx.fillStyle = rgba(rgb, 1); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(x - r * .3, y - r * .3, r * .38, 0, Math.PI * 2); ctx.fill();
    if (n === active) { ctx.strokeStyle = rgba(rgb, .55); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, y, r + 5 + Math.sin(time / 500) * 1.2, 0, Math.PI * 2); ctx.stroke(); }
    ctx.globalAlpha = 1;
  }

  // labels: most meaningful first, never overlapping
  const cands = [];
  for (const n of nodes) {
    if (n.off) { n.la += (0 - n.la) * fast; continue; }
    let p = -1;
    if (n === focus) p = 1e4; else if (n === active) p = 9e3;
    else if (focus && ring.has(n)) p = 5e3 + n.deg;
    else if (query && n.vis > .5) p = 4e3 + n.deg;
    else if (n.hub) p = 3e3;
    else if (groupFocus === n.group) p = 2e3 + n.deg;
    else if (!focus && !query && cam.k > .82 - n.deg * .055) p = n.deg * 10 + cam.k;
    else if (cam.k > 1.3) p = n.deg;
    if (p >= 0) cands.push([p, n]); else n.la += (0 - n.la) * fast;
  }
  cands.sort((a, b) => b[0] - a[0] || a[1].i - b[1].i);
  const placed = [];
  ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.lineJoin = 'round';
  for (const [p, n] of cands) {
    const big = n.hub || n === focus || n === active;
    const size = big ? (n.hub && cam.k < .75 && !focus && !mobile() ? 15 : 13.5) : 12.5, font = `${big ? 500 : 400} ${size}px "IBM Plex Sans", sans-serif`;
    const w = measure(n, font), x = n.sx, y = n.sy + n.sr + 6, box = [x - w / 2 - 4, y - 2, x + w / 2 + 4, y + size + 3];
    const clash = p < 9e3 && placed.some(b => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1]);
    const target = clash ? 0 : Math.max(.12, n.vis);
    n.la += (target - n.la) * fast;
    if (!clash) placed.push(box);
    if (n.la < .02) continue;
    ctx.font = font; ctx.globalAlpha = n.la;
    ctx.strokeStyle = 'rgba(250,248,251,.92)'; ctx.lineWidth = 4; ctx.strokeText(n.short, x, y);
    ctx.fillStyle = big ? '#2a252d' : '#4f4953'; ctx.fillText(n.short, x, y);
  }
  ctx.globalAlpha = 1;
  requestAnimationFrame(frame);
}

/* ---------- start ---------- */
document.querySelector('.interest-index').open = false;
new ResizeObserver(() => { const had = !!W; resize(); if (had && !active) fitAll(); }).observe(brain);
resize();
setTimeout(() => hint.classList.add('gone'), 9000);
requestAnimationFrame(t => { last = t; frame(t); });
})();
