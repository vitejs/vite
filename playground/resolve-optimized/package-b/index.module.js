import a from '@vitejs/test-resolve-optimized-package-a'
import customMain from '@vitejs/test-resolve-optimized-package-custom-main-field'
import customCondition from '@vitejs/test-resolve-optimized-package-custom-condition'

export default `package-b-module:${a}:${customMain}:${customCondition}`
