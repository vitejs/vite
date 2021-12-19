const modules = import.meta.globEager('./*.(js|ts)')
const globWithAlias = import.meta.globEager("@asset/foo.js")

export { modules, globWithAlias }
