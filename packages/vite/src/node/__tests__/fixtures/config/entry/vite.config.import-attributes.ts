// We have to import external json to prevent Vite / esbuild from bundling it.
import pkg from 'vite/package.json' with { type: 'json' }

export default {
  jsonValue: pkg.name,
}
