import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  plugins: [angular()],
  envPrefix: 'VITE_',
  // Asegurar que el archivo .env se cargue correctamente
  envDir: '.',
});