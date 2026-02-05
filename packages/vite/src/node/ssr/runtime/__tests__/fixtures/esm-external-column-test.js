import { outer } from '@vitejs/esm-external-column-test'

function userFn() {
  throw new Error('column test error')
}

outer(userFn)
