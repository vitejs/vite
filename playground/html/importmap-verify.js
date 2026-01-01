import { msg } from 'some-pkg'

console.log(msg)
const testDiv = document.getElementById('importmap-test')
if (testDiv) {
  testDiv.textContent = msg
}
