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

const buildType = process.env.BUILD_TYPE || 'svelte';

export default defineConfig(({ mode }) => ({
  plugins: [
    svelte(),

    ...(buildType === 'svelte'
      ? [
          dts({
            include: ['src'],
            rollupTypes: false,
            beforeWriteFile: (filePath, content) => ({
              filePath,
              content: content.replace(/\/\*\*[\s\S]*?\*\//g, '').replace(/\n{3,}/g, '\n\n'),
            }),
          }),
        ]
      : []),
  ],
  build: {
    emptyOutDir: buildType === 'svelte',
    lib:
      buildType === 'svelte'
        ? {

            entry: {
              index: resolve(__dirname, 'src/index.ts'),
              svelte: resolve(__dirname, 'src/svelte.ts'),
            },
            formats: ['es'],
            fileName: (format, entryName) => `${entryName}.js`,
          }
        : {

            entry: {
              react: resolve(__dirname, 'src/react.ts'),
              vanilla: resolve(__dirname, 'src/vanilla.ts'),
            },
            formats: ['es'],
            fileName: (format, entryName) => `${entryName}.js`,
          },
    rollupOptions: {
      external:
        buildType === 'svelte'
          ? [

              'svelte',
              'svelte/internal',
              'svelte/internal/client',
              'svelte/internal/server',
              /^svelte\//,
            ]
          : [

              'react',
              'react-dom',
              'react/jsx-runtime',
              'react/jsx-dev-runtime',
              /^react\//,
            ],
      output: {
        plugins: mode === 'production' ? [terser(terserConfig)] : [],
        chunkFileNames: '[name].js',
        manualChunks(id) {
          if (buildType === 'svelte') {

            if (id.includes('/core/')) {
              return 'core';
            }
            if (id.includes('/svelte/') && !id.endsWith('/src/svelte.ts')) {
              return 'ui';
            }
          } else {

            if (
              id.includes('svelte/') ||
              id.includes('/core/') ||
              (id.includes('/svelte/') && !id.endsWith('/src/svelte.ts'))
            ) {
              return 'runtime';
            }
          }
        },
      },
    },
    sourcemap: mode === 'development',
    minify: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
}));
