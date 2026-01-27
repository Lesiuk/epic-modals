import { transform } from 'lightningcss';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';

const files = [
  { src: 'src/styles/index.css', dest: 'dist/styles/index.css' },
  { src: 'src/styles/variables.css', dest: 'dist/styles/variables.css' },
  { src: 'src/styles/modal.css', dest: 'dist/styles/modal.css' },
  { src: 'src/styles/dock.css', dest: 'dist/styles/dock.css' },
  { src: 'src/styles/backdrop.css', dest: 'dist/styles/backdrop.css' },
  { src: 'src/styles/animations.css', dest: 'dist/styles/animations.css' },
  { src: 'src/styles/wizard.css', dest: 'dist/styles/wizard.css' },
  { src: 'src/styles/themes/light.css', dest: 'dist/styles/themes/light.css' },
  { src: 'src/styles/themes/dark.css', dest: 'dist/styles/themes/dark.css' },
];

for (const { src, dest } of files) {
  const code = readFileSync(src);
  const { code: minified } = transform({
    filename: src,
    code,
    minify: true,
  });

  const destDir = dirname(dest);
  if (!existsSync(destDir)) {
    mkdirSync(destDir, { recursive: true });
  }

  writeFileSync(dest, minified);
  console.log(`Minified: ${src} → ${dest}`);
}
