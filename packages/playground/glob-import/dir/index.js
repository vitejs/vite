const modules = import.meta.globEager('./*.(js|ts)')
const globWithAlias = import.meta.globEager('@dir/al*.js')

export { modules, globWithAlias }
