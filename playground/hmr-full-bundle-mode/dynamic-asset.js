// asset referenced via CSS `url()`, emitted while bundling this lazy module
import './dynamic-asset.css'
// asset referenced via JS import, emitted while bundling this lazy module
import imageUrl from './dynamic-image.png'

const img = document.createElement('img')
img.className = 'dynamic-image'
img.src = imageUrl
document.querySelector('.dynamic-asset').appendChild(img)

document.querySelector('.dynamic-asset-status').textContent = 'loaded'
