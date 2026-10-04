import { defineConfig, mergeConfig } from 'vite'
import baseConfig from './vite.config-lightningcss.js'

export default mergeConfig(baseConfig, defineConfig({ base: '/base/' }))
