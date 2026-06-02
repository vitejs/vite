import './a-scoped.css' // should be treeshaken away if `a` is not used

export default function a() {
  return 'treeshake-scoped-a'
}
