import axios from 'axios'

axios.get('/ping').then((res) => {
  document.querySelector('.cjs-browser-field').textContent = res.data
})
