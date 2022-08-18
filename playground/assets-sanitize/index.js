import svg from './+circle.svg'
const el = document.body.querySelector('.circle-bg')
el.style.backgroundImage = `url(${svg})`
el.textContent = svg
