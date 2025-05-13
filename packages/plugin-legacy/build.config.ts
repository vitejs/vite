import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: ['src/index'],
  clean: true,
  declaration: true,
  rollup: {
    inlineDependencies: true,
    esbuild: {
      target: 'node20',
    },
  },
})
