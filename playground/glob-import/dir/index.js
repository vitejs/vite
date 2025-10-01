const modules = import.meta.glob('./*.(js|ts)', { eager: true })
const globWithAlias = import.meta.glob('@dir/al*.js', { eager: true })

// test negative glob
import.meta.glob(['@dir/*.js', '!@dir/x.js'])
import.meta.glob(['!@dir/x.js', '@dir/*.js'])

// test for sourcemap
console.log('hello')

export { modules, globWithAlias }
