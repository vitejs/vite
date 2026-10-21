import process from 'node:process'
import nonDep from '@vitejs/test-alias-non-dep'
import dep from '@vitejs/test-alias-original'

export default {
  dep,
  nonDep,
  builtin: process.env['__TEST_ALIAS__'],
}
