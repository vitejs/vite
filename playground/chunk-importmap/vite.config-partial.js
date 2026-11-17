import { defineConfig } from 'vite'
import baseConfig from './vite.config.js'

export default defineConfig(({ command }) => ({
  ...baseConfig,
  build: {
    ...baseConfig.build,
    outDir: 'dist/partial',
    rolldownOptions: {
      ...baseConfig.build.rolldownOptions,
      // Only the `static` chunk is in the import map. Bundled dev does not turn
      // this Rolldown option off, so it is only set for the build.
      experimental:
        command === 'build' ? { chunkImportMap: { include: 'static' } } : {},
    },
  },
}))
