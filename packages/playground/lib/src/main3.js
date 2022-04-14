import pic from '../static/icon.png'

export default function setSrc(el) {
  const node = document.querySelector(el)
  node.src = pic
}
