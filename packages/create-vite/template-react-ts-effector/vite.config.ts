import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { babel } from '@rollup/plugin-babel';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [babel({ extensions: ['.ts'], babelHelpers: 'bundled' }), react({ fastRefresh: false })],
});
