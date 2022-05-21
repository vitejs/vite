import { defineConfig } from 'vite'

import vueJsxPlugin from '@vitejs/plugin-vue-jsx'
import vuePlugin from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vueJsxPlugin({
      include: [/\.tesx$/, /\.[jt]sx$/]
    }),
    vuePlugin(),
    {
      name: 'jsx-query-plugin',
      transform(code, id) {
        if (id.includes('?query=true')) {
          return `
import { createVNode as _createVNode } from "vue";
import { defineComponent, ref } from 'vue';
export default defineComponent(() => {
  const count = ref(6);

  const inc = () => count.value++;

  return () => _createVNode("button", {
    "class": "jsx-with-query",
    "onClick": inc
  }, [count.value]);
});
`
        }
      }
    }
  ],
  build: {
    // to make tests faster
    minify: false
  },
  optimizeDeps: {
    disabled: true
  }
})
