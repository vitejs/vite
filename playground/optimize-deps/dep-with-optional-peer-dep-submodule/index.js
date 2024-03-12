export function callItself() {
  return '[success]'
}

export async function callPeerDepSubmodule() {
  return await import('foobar/baz')
}
