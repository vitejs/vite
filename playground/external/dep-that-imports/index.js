import { version } from 'vue'
import slash from 'slash'

document.querySelector('#imported-vue-version').textContent = version
document.querySelector('#imported-slash-exists').textContent = !!slash
