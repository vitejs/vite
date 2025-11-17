/// <reference types="vite/client" />
/// <reference types="vitepress/client" />

declare module '*.vue' {
  const component: import('vue').DefineComponent<
    Record<string, any>,
    Record<string, any>,
    any
  >
  export default component
}
