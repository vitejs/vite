/// <reference types="vite/client" />
/// <reference types="vitepress/client" />

declare module '*.vue' {
  const component: import('vue').DefineComponent<{}, {}, any>
  export default component
}
