const modules = import.meta.glob('./*.(js|ts)', { eager: true })
const globWithAlias = import.meta.glob('@dir/al*.js', { eager: true })

export { modules, globWithAlias }
