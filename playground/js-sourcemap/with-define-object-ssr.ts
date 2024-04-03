export function error() {
  errorInner()
}

function errorInner() {
  // @ts-expect-error "define"
  throw new Error('with-define-object: ' + JSON.stringify(__testDefineObject))
}
