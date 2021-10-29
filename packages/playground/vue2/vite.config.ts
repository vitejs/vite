import { defineConfig } from 'vite'
import vue2Plugin from '@vitejs/plugin-vue2'

export default defineConfig({
  resolve: {
    alias: {
      '/@': __dirname
    }
  },
  plugins: [
    vue2Plugin({ jsx: true }),
    {
      name: 'customBlock',
      transform(code, id) {
        if (/type=custom/i.test(id)) {
          const transformedAssignment = code
            .trim()
            .replace(/export default/, 'const __customBlock =')
          return {
            code: `${transformedAssignment}
              export default function (component) {
              const options = component.options;
              if (!options.__customBlock) {
                options.__customBlock = {};
              }
              Object.assign(options.__customBlock, __customBlock);
            }`,
            map: null
          }
        }
      }
    }
  ],
  build: {
    // to make tests faster
    minify: false
  },
  css: {
    modules: {
      localsConvention: 'camelCaseOnly'
    }
  }
})
