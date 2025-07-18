import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig(({ mode }) => {
  return {
    plugins: [angular()],
    envPrefix: 'VITE_',
    envDir: '.',
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || ''),
      'import.meta.env.VITE_SUPABASE_KEY': JSON.stringify(process.env.VITE_SUPABASE_KEY || ''),
      'import.meta.env.VITE_RAWG_API_KEY': JSON.stringify(process.env.VITE_RAWG_API_KEY || ''),
    },
    build: {
      target: 'esnext',
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    },
  };
});