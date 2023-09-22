// import file to test css build handling
import './index.css'

export default async function message(sel) {
  document.querySelector(sel).textContent = 'success'
}
