import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import checker from 'vite-plugin-checker';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // checker({
    //   typescript: {
    //     tsconfigPath: './tsconfig.app.json',
    //   },
    //   eslint: {
    //     lintCommand: 'lint',
    //     useFlatConfig: true,
    //   }
    // }),
    react(),
  ],
})
