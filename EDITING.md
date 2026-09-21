# Updating this site

Edit `content.json`, then run `node build.mjs`. Commit the generated HTML along with your changes. GitHub Pages publishes the `main` branch automatically.

Run `node preview.mjs` for a local preview at http://127.0.0.1:4173/.

- Add a portfolio URL in `portfolio` when ready.
- Book entries use `title`, `author`, `color`, and `ink`.
- Art entries use `title`, `artist`, `image` (an HTTPS image URL), `alt`, and optionally `source` (the artwork source page). Use artwork you have permission to display.
- Essay entries use `slug` (lowercase words separated by hyphens), `title`, `date` (YYYY-MM-DD), `summary`, and `paragraphs` (a list of text paragraphs). Each essay gets its own page automatically. To remove an essay, remove its entry and its generated HTML file.

The music page's album and listening link are in `build.mjs`. Its rotation is controlled by `music.js`, respects reduced-motion preferences, and does not autoplay audio.

The books interaction is an original CSS implementation inspired by the interactive library shared at https://x.com/carrabre/status/2081930429435875694. Covers are custom typographic treatments, not reproductions of published editions.

Album artwork is provided by Apple's album metadata for Ultraviolence: https://music.apple.com/us/album/ultraviolence/1440831284.
