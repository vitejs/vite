/// <reference types="vite/client" />
/// <reference types="vitepress/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  // Use Record<string, any> to avoid lint errors on '{}'
  const component: DefineComponent<
    Record<string, any>,
    Record<string, any>,
    any
  >

  export default component
}
