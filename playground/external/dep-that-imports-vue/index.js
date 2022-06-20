import { version } from 'vue'

export default function foo() {
  document.querySelector('#imported-vue-version').textContent = version
}
