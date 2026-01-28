import { svelte } from '@sveltejs/vite-plugin-svelte';
import dts from 'vite-plugin-dts';
import terser from '@rollup/plugin-terser';
import { defineConfig } from 'vite';
import { resolve } from 'path';

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

const buildPhase = process.env.BUILD_PHASE || 'core';

export default defineConfig(({ mode }) => ({
  plugins: [
    svelte(),
    dts({
      include: buildPhase === 'core' ? ['src/core'] : ['src/svelte', 'src/react', 'src/vanilla', 'src/svelte.ts', 'src/react.ts', 'src/vanilla.ts'],
      exclude: ['**/*.test.ts', '**/*.test.d.ts'],
      rollupTypes: true,
      copyDtsFiles: false,
      beforeWriteFile: (filePath, content) => ({
        filePath,
        content: content.replace(/\/\*\*[\s\S]*?\*\//g, '').replace(/\n{3,}/g, '\n\n'),
      }),
    }),
  ],
  build: {
    emptyOutDir: buildPhase === 'core',
    lib:
      buildPhase === 'core'
        ? {
            entry: { core: resolve(__dirname, 'src/core/index.ts') },
            formats: ['es'],
            fileName: () => 'core.js',
          }
        : {
            entry: {
              svelte: resolve(__dirname, 'src/svelte.ts'),
              react: resolve(__dirname, 'src/react.ts'),
              vanilla: resolve(__dirname, 'src/vanilla.ts'),
            },
            formats: ['es'],
            fileName: (_format, entryName) => `${entryName}.js`,
          },
    rollupOptions: {
      external:
        buildPhase === 'core'
          ? []
          : [

              /\/core(\/|$)/,

              'svelte',
              'svelte/internal',
              'svelte/internal/client',
              'svelte/internal/server',
              /^svelte\//,

              'react',
              'react-dom',
              'react/jsx-runtime',
              'react/jsx-dev-runtime',
              /^react\//,
            ],
      output: {
        plugins: mode === 'production' ? [terser(terserConfig)] : [],
        chunkFileNames: '[name].js',
        ...(buildPhase === 'adapters' && {
          paths: (id: string) => {
            if (id.match(/\/core(\/|$)/)) return './core.js';
            return id;
          },
        }),
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
