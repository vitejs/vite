import slash3 from 'slash3'
import slash5 from 'slash5'
import { version } from 'vue'

document.querySelector('#imported-vue-version').textContent = version
document.querySelector('#imported-slash5-exists').textContent =
  !!slash5('foo/bar')
document.querySelector('#imported-slash3-exists').textContent =
  !!slash3('foo/bar')
