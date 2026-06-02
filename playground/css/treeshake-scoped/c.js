import './c-scoped.css' // should be treeshaken away if `b` is not used

export default function c() {
  return 'treeshake-scoped-c'
}

export function cUsed() {
  // used but does not depend on scoped css
  return 'c-used'
}
