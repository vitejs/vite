import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'

const escapeAliases = fs
  .readdirSync(path.join(__dirname, 'escape'), { withFileTypes: true })
  .filter((f) => f.isDirectory())
  .map((f) => f.name)
  .reduce((aliases: Record<string, string>, dir) => {
    aliases[`@escape_${dir}_mod`] = path.resolve(
      __dirname,
      `./escape/${dir}/mod`,
    )
    return aliases
  }, {})

export default defineConfig({
  resolve: {
    alias: {
      ...escapeAliases,
      '@dir': path.resolve(__dirname, './dir/'),
    },
  },
  build: {
    sourcemap: true,
  },
})
