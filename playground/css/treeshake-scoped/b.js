import './b-scoped.css' // should be treeshaken away if `b` is not used

export default function b() {
  return 'treeshake-scoped-b'
}
