import foo from './foo'

const asyncImport = async () => {
  const { foo } = await import('./foo.js')
  foo()
}

foo()
asyncImport()
