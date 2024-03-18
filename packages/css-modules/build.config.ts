import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index.ts',
    'src/lightningcss/index.ts',
    'src/postcss/index.ts',
  ],
  clean: true,
  declaration: 'node16',
  rollup: {
    inlineDependencies: true,
    esbuild: {
      target: 'node18',
    },
  },
})
