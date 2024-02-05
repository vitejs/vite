export function error() {
  errorInner()
}

function errorInner() {
  // @ts-ignore
  throw new Error('with-define-object: ' + JSON.stringify(__testDefineObject))
}
