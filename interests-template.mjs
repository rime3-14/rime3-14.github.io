export function interestsPage(data,esc) {
const icon = {
  plus:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3 8h10"/></svg>',
  minus:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10"/></svg>',
  fit:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 6V2.5H6M10 2.5h3.5V6M13.5 10v3.5H10M6 13.5H2.5V10"/></svg>',
  search:'<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.5"/><path d="m10.5 10.5 3 3"/></svg>',
  close:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8"/></svg>'
};
return `<section class="map-heading"><div><p class="eyebrow">A little bit of everything, connected.</p><h1>Interests.</h1></div><p>A map of things I keep coming back to.</p></section>
<div class="brain" id="brain" hidden>
<canvas id="interest-map" tabindex="0" aria-label="Interactive map of interests. Use the search, the topics, or the list below the map to explore with a keyboard."></canvas>
<div class="brain-search"><label class="visually-hidden" for="map-search">Find a thread</label>${icon.search}<input id="map-search" type="search" placeholder="Find a thread…" autocomplete="off" spellcheck="false" role="combobox" aria-expanded="false" aria-controls="map-results"><kbd>/</kbd><ul id="map-results" role="listbox" hidden></ul></div>
<aside class="brain-card" id="map-card" aria-live="polite" aria-label="Selected interest"></aside>
<div class="brain-legend" aria-label="Topics">${data.groups.map((g,i)=>`<button data-topic="${i}" style="--topic:${g.color}">${esc(g.label)}</button>`).join('')}</div>
<div class="brain-controls"><button id="zoom-in" aria-label="Zoom in">${icon.plus}</button><button id="zoom-out" aria-label="Zoom out">${icon.minus}</button><button id="map-reset" aria-label="Show the whole map">${icon.fit}</button></div>
<p class="brain-hint">Drag to wander · scroll or pinch to zoom · pull a node to tug its threads</p>
<template id="icon-close">${icon.close}</template>
</div>
<details class="interest-index" open><summary>All interests, in words</summary><div class="interest-index-grid">${data.groups.map((g,i)=>`<section style="--topic:${g.color}"><h2>${esc(g.label)}</h2><ul>${data.nodes.filter(n=>n.group===i&&!n.hub).map(n=>`<li><button data-interest="${esc(n.id)}">${esc(n.label)}</button></li>`).join('')}</ul></section>`).join('')}</div></details>
<script id="interests-data" type="application/json">${JSON.stringify(data).replace(/</g,'\\u003c')}</script>`;
}
