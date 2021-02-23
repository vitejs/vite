declare module 'css-color-names' {
  const colors: Record<string, string>
  export default colors
}

declare module '*.vue' {
  import { ComponentOptions } from 'vue'
  const component: ComponentOptions
  export default component
}
