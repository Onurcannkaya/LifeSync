import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    minify: 'esbuild',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: undefined // Let Vite handle module splitting optimally
      }
    }
  },
  server: {
    port: 3000,
    open: false
  },
  publicDir: '../' // Serve manifest and icons from root if needed
});

