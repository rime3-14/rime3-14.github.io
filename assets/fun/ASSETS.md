# Fun room artwork

All pictures were supplied by Rime for this site. Web assets are in this directory; the page maps them in `fun-art.mjs`. The homepage and the other sections use no new images.

- Navigation: `mirror.webp`, `camera.webp`, `door-bag.webp`, `crayon.webp`, `postcard.webp`, `elsewhere.webp`.
- Right sidebar: `cat-card.webp`.
- Bag: `burgundy-bag.webp`, `gloss.webp`, `earphones.webp`, `charm.webp`, `gum.webp`, `notebook.webp`, `glasses.webp`, `photo-frame.webp`, `receipt.webp`.

The book remains a drawing until Rime supplies its cover/title. The photo frame and cinema ticket are the supplied illustrations; neither represents a newly supplied personal photograph or dated visit.

## Preparation

The mirror, camera, crayon, postcard, paper clips, photo frame, and cat card retain the supplied artwork. SVG viewports frame the drawings; an SVG ink filter hides paper behind monochrome linework. The cat card has a small CSS edge clip.

The built-in image generation/editing tool was used in background-extraction mode for the burgundy bag, illustrated bag, lip tint, earphones, Kuromi, notebook, gum, glasses, and ticket. These are AI-assisted cutouts, rather than pixel-exact manual masks. The ticket edit also removed the screenshot's close button. Sharp trims unused transparent margins and exports small WebP versions, preserving transparency. Original-size outputs remain in Codex's generated_images folder; local working source copies are under the ignored `.sites-runtime/fun-sources` directory.

## Edit prompts

Shared object prompt: “Use case: background-extraction. Edit target: this supplied image. Make a tightly framed actual transparent PNG cutout of ONLY the [object]. Preserve the exact supplied object, colors, proportions, photographic texture or illustration and every original detail. Remove only the background and any background visible through gaps. Do not redraw or stylize. No new objects, no shadow, no painted checkerboard. Actual alpha transparency. This will be a small website object asset.”

Object-specific instructions:

- Burgundy bag: include both straps, silver hardware, rhinestone bow, dangling cords, black heart charm, and cream rabbit charm; remove wall, poster, frame, and space between straps; preserve burgundy texture, perspective, and cropped strap ends; do not invent a missing upper strap.
- Illustrated bag: remove only pale pink background, including inside the handle; retain black outlines, cream striped body, brown bows, muted rose strap, gold rings, proportions, and irregular strokes.
- Lip tint: preserve the rhode peptide lip tint tube and all lettering.
- Earphones: retain coiled white wires, brown hair clip, and gaps.
- Kuromi: retain silver clip and white plush face and feet.
- Notebook: retain both pens, green ribbon, pages, and handwriting.
- Cinema ticket: remove circular X overlay, restore paper underneath; remove outside white and edge cutouts; preserve other artwork and lettering.
- Gum and glasses: extract the exact pink/yellow Bubble Gum wrapper illustration or pink watercolor eyeglasses; remove paper outside and through openings; retain colors, irregular hand-drawn marks, proportions, and lettering; no redesign, checkerboard, or shadows.
