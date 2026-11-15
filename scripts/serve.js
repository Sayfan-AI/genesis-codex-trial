import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const files = new Map([
  ['/', ['index.html', 'text/html']],
  ['/index.html', ['index.html', 'text/html']],
  ['/styles.css', ['styles.css', 'text/css']],
  ['/src/app.js', ['src/app.js', 'text/javascript']],
  ['/src/temperature.js', ['src/temperature.js', 'text/javascript']],
]);
const root = new URL(process.env.STATIC_DIR === 'dist' ? '../dist/' : '../', import.meta.url);
const basePath = process.env.BASE_PATH || '/';
const port = Number(process.env.PORT || 4173);
createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  const file = pathname.startsWith(basePath) ? files.get(`/${pathname.slice(basePath.length)}`) : undefined;
  if (!file) {
    response.writeHead(404).end('Not found');
    return;
  }
  try {
    const body = await readFile(new URL(file[0], root));
    response.writeHead(200, { 'Content-Type': `${file[1]}; charset=utf-8` }).end(body);
  } catch {
    response.writeHead(500).end('Unable to load page');
  }
}).listen(port, '127.0.0.1', () => console.log(`Converter: http://127.0.0.1:${port}${basePath}`));
