import plusCircle from './+circle.svg'
import underscoreCircle from './_circle.svg'
function setData(classname, file) {
  const el = document.body.querySelector(classname)
  el.style.backgroundImage = `url(${file})`
  el.textContent = file
}
setData('.plus-circle', plusCircle)
setData('.underscore-circle', underscoreCircle)
