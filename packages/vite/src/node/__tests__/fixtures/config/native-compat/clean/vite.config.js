import { value } from './helper.js'

export default {
  define: {
    DIR: JSON.stringify(import.meta.dirname),
    VALUE: value,
  },
}
