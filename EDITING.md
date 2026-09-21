# Updating this site

Edit `content.json`, then run `node build.mjs`. Commit the generated HTML along with your changes. GitHub Pages publishes the `main` branch automatically.

Run `node preview.mjs` for a local preview at http://127.0.0.1:4173/.

- Add a portfolio URL in `portfolio` when ready.
- Book entries use `title`, `author`, `color`, and `ink`.
- Art entries use `title`, `artist`, `date`, `location`, `image` (an HTTPS image URL), `alt`, and `source` (the artwork source page), with optional `note` and `credit`. The gallery preserves each image’s proportions. Hover, tap, Enter, or Space flips a card; Escape turns it back. Source links are under the gallery. Use artwork you have permission to display.
- Essay entries use `slug` (lowercase words separated by hyphens), `title`, `date` (YYYY-MM-DD), `summary`, and `paragraphs` (a list of text paragraphs). Each essay gets its own page automatically. To remove an essay, remove its entry and its generated HTML file.

The music page's albums, covers, selected tracks, preview URLs, and Apple Music links are in `albums.json`. Rebuild after changing them. Selecting an album updates the vinyl and plays that song's preview; the page never starts audio on initial load. The rotation and player are controlled by `music.js`, with reduced-motion support, keyboard controls, and a streaming link if a preview is unavailable.

The books interaction is an original CSS implementation inspired by the interactive library shared at https://x.com/carrabre/status/2081930429435875694. Covers are custom typographic treatments, not reproductions of published editions.

Album artwork and song previews come from Apple's iTunes metadata API. Each album has its source link in `albums.json`. Previews are streamed, not stored in this repository.

Fashion is intentionally omitted from navigation until its content is ready. Its page source is preserved.

The homepage greeting uses Rime’s original, unmodified drawing in `assets/rime-handwriting.png`. An SVG viewport excludes the spellcheck underline; its filter removes the light background and renders the original ink in `#94566d`. The drawing is not recreated with a font. Change its display width in `.handwritten-greeting` in `styles.css`.
