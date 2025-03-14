import './shared-scoped.css'

export default function shared(id, text) {
  document.getElementById(id).innerHTML =
    `<div class="shared scoped">${text}</div>`
}
