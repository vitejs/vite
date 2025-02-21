import './d-scoped.css' // should be treeshaken away if `d` is not used

export default function d() {
  return 'treeshake-scoped-d'
}
