import config from './vite.config.js'
config.resolve.mainFields = [
  'custom',
  ...config.resolve.mainFields.filter((f) => f !== 'custom'),
]
config.build.outDir = 'dist-mainfields-custom-first'
export default config
