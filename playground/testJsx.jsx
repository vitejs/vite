import { h, render } from 'preact'
import { Test } from './testTsx.tsx'

const Component = () => <div>
  Rendered from Preact JSX
  <Test count={1337} />
</div>

export function renderPreact(el) {
  render(h(Component), el)
}
