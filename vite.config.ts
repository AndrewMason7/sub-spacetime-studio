import { defineConfig } from 'vite';

export default defineConfig({
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
