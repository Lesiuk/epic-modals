import { readFileSync } from 'fs';
import { basename, resolve } from 'path';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import dts from 'vite-plugin-dts';
import terser from '@rollup/plugin-terser';
import { defineConfig } from 'vite';

const terserConfig = {
  ecma: 2020,
  module: true,
  compress: {
    ecma: 2020,
    module: true,
    toplevel: true,
    passes: 10,
    drop_console: true,
    drop_debugger: true,
  },
  mangle: true,
  format: {
    comments: false,
  },
  toplevel: true,
};

export default defineConfig(({ mode }) => ({
  plugins: [
    svelte(),
    dts({
      tsconfigPath: './tsconfig.build.json',
      exclude: ['**/*.test.ts', '**/*.test.tsx', '**/*.test.svelte', '**/*.test.d.ts'],
      rollupTypes: true,
      copyDtsFiles: false,
      beforeWriteFile: (filePath, content) => {
        if (basename(filePath) === 'svelte.d.ts') {
          return {
            filePath,
            content: readFileSync(resolve(__dirname, 'types/svelte.d.ts'), 'utf-8'),
          };
        }
        return {
          filePath,
          content: content.replace(/\/\*\*[\s\S]*?\*\//g, '').replace(/\n{3,}/g, '\n\n'),
        };
      },
    }),
  ],
  build: {
    emptyOutDir: true,
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        svelte: resolve(__dirname, 'src/svelte.ts'),
        react: resolve(__dirname, 'src/react.ts'),
        vanilla: resolve(__dirname, 'src/vanilla.ts'),
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: [/^react(-dom)?(\/.*)?$/, /^svelte(\/.*)?$/],
      output: {
        chunkFileNames: '[name].js',
        manualChunks(id) {
          if (id.includes('/src/core/')) return 'core';
        },
        plugins: mode === 'production' ? [terser(terserConfig)] : [],
      },
    },
    sourcemap: false,
    minify: mode === 'production',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
}));
