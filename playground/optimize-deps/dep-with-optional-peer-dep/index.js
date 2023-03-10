export function callItself() {
  return '[success]'
}

export async function callPeerDep() {
  return await import('foobar')
}
