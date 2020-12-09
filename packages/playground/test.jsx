import { h, render } from 'preact'
import './imported.css'
import { log } from './foo'
import json from './example.json'

function App({ data }) {
  return <div>
    {JSON.stringify(data)}
    {JSON.stringify(json)}
  </div>
}

log('from ts!fse')

export function hi() {
  fetch('/api/todos/1')
    .then((res) => res.json())
    .then((data) => {
      render(<App data={data} />, document.getElementById('app'))
    })
}

hi()
