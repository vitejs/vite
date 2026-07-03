import moduleCondition from '@vite/test-config-plugin-module-condition'
import { array } from '../siblings/foo.ts'
import importsField from '#imports-field'

export default {
  array,
  moduleCondition,
  importsField,
}
