import './require-polyfill'
import '@vitejs/test-dep-that-imports'
import '@vitejs/test-dep-that-requires'
import pluginExternal from 'plugin-external'
import pluginExternalRewritten from 'plugin-external-rewritten'

document.querySelector('#plugin-external-static').textContent = pluginExternal
document.querySelector('#plugin-external-rewritten-static').textContent =
  pluginExternalRewritten

import('plugin-external').then(({ default: value }) => {
  document.querySelector('#plugin-external-dynamic').textContent = value
})
import('plugin-external-rewritten').then(({ default: value }) => {
  document.querySelector('#plugin-external-rewritten-dynamic').textContent =
    value
})
