import type { UserConfig } from 'vite'

const config: UserConfig = {
  alias: {
    alias: '/aliased'
  },
  jsx: {
    factory: 'h',
    fragment: 'Fragment'
  },
  minify: false
}

export default config
