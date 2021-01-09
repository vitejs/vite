import modules from 'glob:./*.js'

document.querySelector('.filtered').textContent = JSON.stringify(
  modules,
  null,
  2
)

export default modules
