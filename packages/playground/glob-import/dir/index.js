const modules = import.meta.globEager('./*.(js|ts)')
const globWithAlias = import.meta.globEager('@dir/alias.js')

export { modules, globWithAlias }
