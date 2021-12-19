const modules = import.meta.globEager('./*.(js|ts)')
const globWithAlias = import.meta.glob("@asset/foo.js")

export { modules, globWithAlias }
