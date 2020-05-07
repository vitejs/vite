import { h } from 'preact'

export function Test(props: { count: 0 }) {
  return <div>Rendered from TSX: count is {props.count}</div>
}
