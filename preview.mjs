import http from 'node:http';
import { readFile, readdir } from 'node:fs/promises';

const files = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/music.js', ['music.js', 'text/javascript; charset=utf-8']],
  ['/books.js', ['books.js', 'text/javascript; charset=utf-8']],
  ['/art.js', ['art.js', 'text/javascript; charset=utf-8']],
  ['/assets/rime-handwriting.png', ['assets/rime-handwriting.png', 'image/png']],
  ...['books', 'fashion', 'music', 'essays', 'art', 'sports'].flatMap(section => [
    [`/${section}/`, [`${section}/index.html`, 'text/html; charset=utf-8']],
    [`/${section}/index.html`, [`${section}/index.html`, 'text/html; charset=utf-8']],
  ]),
]);
for (const name of await readdir(new URL('essays/', import.meta.url))) {
  if (/^[a-z0-9-]+\.html$/.test(name)) files.set(`/essays/${name}`, [`essays/${name}`, 'text/html; charset=utf-8']);
}
const server = http.createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  if (['books', 'fashion', 'music', 'essays', 'art', 'sports'].some(section => pathname === `/${section}`)) {
    response.writeHead(301, { Location: `${pathname}/` }); response.end(); return;
  }
  const route = files.get(pathname);
  if (!route) { response.writeHead(404); response.end('Not found'); return; }
  try {
    const contents = await readFile(new URL(route[0], import.meta.url));
    response.writeHead(200, { 'Content-Type': route[1], 'Cache-Control': 'no-store' });
    response.end(contents);
  } catch {
    response.writeHead(500); response.end('Unable to load this page');
  }
});
server.listen(4173, '127.0.0.1', () => console.log('Preview: http://127.0.0.1:4173'));
