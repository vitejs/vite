/// <reference types="vite/client" />
/// <reference types="vitepress/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<
    Record<string, any>,
    Record<string, any>,
    any
  >
  export default component
}

declare module 'vitepress/dist/client/theme-default/composables/langs.js' {
  export function useLangs(options?: any): any
}

declare module 'vitepress/dist/client/shared.js' {
  export function isExternal(path: string): boolean
}
