import { copyFile, mkdir, rm } from 'node:fs/promises';

// Ship only the browser assets. Relative URLs work at the repository subpath.
const root = new URL('../', import.meta.url);
const output = new URL('../dist/', import.meta.url);
await rm(output, { recursive: true, force: true });
await mkdir(new URL('src/', output), { recursive: true });
for (const file of ['index.html', 'styles.css', 'src/app.js', 'src/temperature.js']) {
  await copyFile(new URL(file, root), new URL(file, output));
}
console.log('Built static site in dist/');
