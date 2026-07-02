import { value } from './helper.ts'

export default {
  define: {
    DIR: JSON.stringify(import.meta.dirname),
    VALUE: value,
  },
}
