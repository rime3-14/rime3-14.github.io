# Updating this site

Edit `content.json`, then run `node build.mjs`. Commit the generated HTML along with your changes. GitHub Pages publishes the `main` branch automatically.

Run `node preview.mjs` for a local preview at http://127.0.0.1:4173/.

- The professional-site note uses the URL in `portfolio`.
- Book entries use `title`, `author`, optional `translator`, `color`, `ink`, `cover`, `coverWidth`, `coverHeight`, `edition`, `isbn`, and `source` (the publisher page). Store covers in `assets/books/`; dimensions preserve the actual edition’s proportions. Goodreads searches use its ISBN.
- Art entries use `title`, `artist`, `date`, `location`, `image` (an HTTPS image URL or a local path such as `../assets/art/work.jpg`), `alt`, and `source` (the artwork source page), with optional `note` and `credit`. The gallery preserves each image’s proportions. Hover, tap, Enter, or Space flips a card; Escape turns it back. Source links are under the gallery. Use artwork you have permission to display.
- `likedEssays` entries use `title`, `author`, `url`, and optional `note` (for example, `PDF`). These appear as external reading links, separately from Rime’s writing.
- Essay entries use `slug` (lowercase words separated by hyphens), `title`, `date` (YYYY-MM-DD), `summary`, and `paragraphs` (a list of text paragraphs). Each essay gets its own page automatically. To remove an essay, remove its entry and its generated HTML file.

The music page's albums, covers, selected tracks, preview URLs, and Apple Music links are in `albums.json`. Rebuild after changing them. Selecting an album updates the vinyl and plays that song's preview; the page never starts audio on initial load. The rotation and player are controlled by `music.js`, with reduced-motion support, keyboard controls, and a streaming link if a preview is unavailable.

The books interaction is an original CSS implementation inspired by the interactive library reference and shelf video. Front covers reproduce published editions, with publisher links in the inspection view. The spines are complementary typographic treatments. Asset sources are recorded in `assets/books/SOURCES.md`. `books-template.mjs`, `books.css`, and `books.js` control the shelf and inspect-volume dialog. Click a spine or use the previous/next controls; Escape closes the dialog.

## The hidden room

The only entrance on the main site is the small footer link. The room is at `/fun/`, with independent styles and navigation. It is omitted from search indexing, but is still a public page.

Edit `fun-content.json`, then rebuild:

- `portrait`: a local image path such as `../assets/fun/portrait.jpg`. Leave empty until the portrait is ready. The mirror converts the image to ASCII in the browser. Visitors can also try their own image locally; it is never uploaded.
- `photos`: entries with `image`, `alt`, and `caption`. Leave the array empty to show the unfilled photo frames. Each populated print opens in a lightbox.
- `travels`: entries with `country`, `caption`, `image`, optional `alt` and `region`, and `theme` (`spain`, `france`, `germany`, or `italy`). An empty image displays an original country illustration. Replace these starter cards with actual travel details later.
- `bag`: entries with `id`, `name`, and `note`. IDs select the original object drawings: `book`, `gloss`, `earphones`, `charm`, `gum`, `notebook`, `glasses`, `photos`, `receipt`.

Keep images under `assets/fun/`, using simple filenames without spaces. HTTPS image URLs also work; a portrait served elsewhere must allow cross-origin canvas access.

The supplied room doodles, cat card, and bag belongings are mapped in `fun-art.mjs`. Their optimized WebP files and preparation notes are under `assets/fun/`. Change these mappings to replace an object image without changing its interaction or caption.

Sketches are stored in the visitor's browser on that device, with PNG/SVG download buttons. This is a personal drawing pad, not a public guestbook: drawings are not sent to Rime or other visitors. The empty portrait, photo frames, current-book title, and cinema receipt are intentional placeholders awaiting Rime's content.

Album artwork and song previews come from Apple's iTunes metadata API. Each album has its source link in `albums.json`. Previews are streamed, not stored in this repository.

Fashion is intentionally omitted from navigation until its content is ready. Its page source is preserved.

The homepage greeting uses Rime’s original, unmodified drawing in `assets/rime-handwriting.png`. An SVG viewport excludes the spellcheck underline; its filter removes the light background and renders the original ink in `#94566d`. The drawing is not recreated with a font. Change its display width in `.handwritten-greeting` in `styles.css`.

## Interests map

Edit `interests-data.json`: `groups` sets the topic colours, `nodes` holds labels and optional notes/URLs, and `edges` lists pairs of node IDs with an association label. IDs must be unique and every edge endpoint must exist. Run `node build.mjs` after changes. The old Sports route redirects to Interests. The map is drawn on a canvas by `interests.js`: each group becomes a soft-coloured region, nodes settle with a light force simulation (drag one to tug its threads), labels fade in by zoom level and never overlap, and signals travel along the threads (disabled with reduced motion). Styling for the floating search, card, topics and controls is in `interests.css`. The "Start somewhere" suggestions are listed in `renderCard()`.
