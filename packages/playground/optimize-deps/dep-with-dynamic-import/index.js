export const lazyFoo = async function () {
  const { foo } = await import('./dynamic.js')
  return foo
}
