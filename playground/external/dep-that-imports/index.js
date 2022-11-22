import { version } from 'vue'
import slash from 'slash5'

document.querySelector('#imported-vue-version').textContent = version
document.querySelector('#imported-slash5-exists').textContent = !!slash
