import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'public/manifest.json',
          dest: '.'
        },
        {
          src: 'public/icons',
          dest: '.'
        }
      ]
    })
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'src/background/index.ts'),
        content: resolve(__dirname, 'src/content/index.ts'),
        popup: resolve(__dirname, 'src/popup/index.html')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Place scripts in appropriate directories
          if (chunkInfo.name === 'background') {
            return 'background/[name].js';
          }
          if (chunkInfo.name === 'content') {
            return 'content/[name].js';
          }
          if (chunkInfo.name === 'popup') {
            return 'popup/[name].js';
          }
          return '[name].js';
        },
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || '';
          // Handle CSS files
          if (name.endsWith('.css')) {
            if (name.includes('popup')) {
              return 'popup/[name][extname]';
            }
            return 'content/[name][extname]';
          }
          // Handle HTML files
          if (name.endsWith('.html')) {
            return 'popup/[name][extname]';
          }
          return 'assets/[name][extname]';
        }
      }
    },
    // Ensure we don't minify too aggressively for debugging
    minify: false,
    sourcemap: true
  }
});
