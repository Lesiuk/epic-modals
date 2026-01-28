import { bundle } from 'lightningcss';
import { writeFileSync, mkdirSync, existsSync, unlinkSync } from 'fs';
import { dirname, resolve } from 'path';

const viteGeneratedCss = 'dist/epic-modals.css';
if (existsSync(viteGeneratedCss)) {
  unlinkSync(viteGeneratedCss);
}

const bundles = [
  { src: 'src/styles/basic.css', dest: 'dist/styles/basic.css' },
  { src: 'src/styles/showcase.css', dest: 'dist/styles/showcase.css' },
];

for (const { src, dest } of bundles) {
  const { code } = bundle({
    filename: resolve(src),
    minify: true,
  });

  const destDir = dirname(dest);
  if (!existsSync(destDir)) {
    mkdirSync(destDir, { recursive: true });
  }

  writeFileSync(dest, code);
  console.log(`Bundled: ${src} → ${dest}`);
}
