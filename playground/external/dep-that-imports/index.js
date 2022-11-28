import { version } from 'vue'
import slash5 from 'slash5'
import slash3 from 'slash3'

document.querySelector('#imported-vue-version').textContent = version
document.querySelector('#imported-slash5-exists').textContent =
  !!slash5('foo/bar')
document.querySelector('#imported-slash3-exists').textContent =
  !!slash3('foo/bar')
