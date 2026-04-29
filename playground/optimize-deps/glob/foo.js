import axios from '@vitejs/test-dep-cjs-browser-field'

axios.get('/ping').then((res) => {
  document.querySelector('.cjs-browser-field').textContent = res.data
})
