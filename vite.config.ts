import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '127.0.0.1',
    port: 5188,
    allowedHosts: true
  },
  preview: {
    host: '127.0.0.1',
    port: 5188,
    allowedHosts: true
  },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three') || id.includes('postprocessing')) {
              return 'vendor-three-webgl';
            }
            if (id.includes('shiki')) {
              return 'vendor-shiki-lean4';
            }
            if (id.includes('framer-motion') || id.includes('lucide-react')) {
              return 'vendor-ui-motion';
            }
            if (id.includes('katex')) {
              return 'vendor-katex-math';
            }
            return 'vendor-core';
          }
        }
      }
    }
  }
});
