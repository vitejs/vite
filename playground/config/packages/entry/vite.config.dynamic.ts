import siblingsDynamic from '../siblings/dynamic.js'

export default {
  knownImport: () => import('../siblings/ok.js'),
  rawImport: (id: string) => import(id),
  siblingsDynamic,
}
