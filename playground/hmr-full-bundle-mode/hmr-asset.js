// self-accepting module with no asset import; the spec adds one via an HMR edit
const slot = document.querySelector('.hmr-asset')
const img = document.createElement('img')
img.id = 'hmr-asset-image'
img.alt = 'hmr-asset'
slot.replaceChildren(img)
/* @asset-src */

import.meta.hot?.accept()
