import { dependencyIsMain } from './dependency'

export default {
  isMain: import.meta.main,
  dependencyIsMain,
  url: import.meta.url,
  dirname: import.meta.dirname,
  filename: import.meta.filename,
}
