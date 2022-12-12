declare module 'css-color-names' {
  const colors: Record<string, string>
  export default colors
}

declare module 'kill-port' {
  const kill: (port: number) => Promise<void>
  export default kill
}

declare module '*.vue' {
  import type { ComponentOptions } from 'vue'
  const component: ComponentOptions
  export default component
}

import 'vite'
declare module 'vite' {
  export interface UserConfig {
    /**
     * special test only hook
     *
     * runs after build and before preview
     */
    __test__?: () => void
  }
}
