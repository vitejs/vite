import sortObjectDeep from '../sortObjectDeep'

const modules = sortObjectDeep(import.meta.globEager('./*.js', './_*.js'))

export { modules }
