import config from './vite.config.js'
config.resolve.mainFields = [
  'custom',
  ...config.resolve.mainFields.filter((f) => f !== 'custom'),
]
export default config
