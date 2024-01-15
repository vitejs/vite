import dep from '@vitejs/test-alias-original'
import nonDep from '@vitejs/test-alias-non-dep'
import process from 'node:process'

export default {
  dep,
  nonDep,
  builtin: process.env['__TEST_ALIAS__'],
}
