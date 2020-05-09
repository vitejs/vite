import type { UserConfig } from 'vite'

const config: UserConfig = {
  jsx: {
    factory: 'h',
    fragment: 'Fragment'
  },
  minify: false
}

export default config
