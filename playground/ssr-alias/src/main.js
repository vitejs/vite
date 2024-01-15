import process from 'node:process'
import dep from '@vitejs/test-alias-original'
import nonDep from '@vitejs/test-alias-non-dep'

export default {
  dep,
  nonDep,
  builtin: process.env['__TEST_ALIAS__'],
}
