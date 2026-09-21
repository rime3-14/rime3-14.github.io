import http from 'node:http';
import { readFile } from 'node:fs/promises';

const files = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
]);
const server = http.createServer(async (request, response) => {
  const route = files.get(new URL(request.url, 'http://localhost').pathname);
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
