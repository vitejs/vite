import { render } from 'preact'

function MyComponent(props) {
  return <div>{props.msg}</div>
}

render(<MyComponent msg="Hello Preact!" />, document.getElementById('app'))
