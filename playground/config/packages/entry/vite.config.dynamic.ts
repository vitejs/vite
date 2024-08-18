import siblingsDynamic from '../siblings/dynamic.js'

export default {
  rawImport: (id: string) => import(id),
  siblingsDynamic,
}
