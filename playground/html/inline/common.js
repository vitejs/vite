import './dep1'
import './dep2'

export function log(name) {
  document.getElementById('output').innerHTML += name + ' '
}

log('common')
