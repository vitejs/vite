import b from '@vitejs/test-resolve-optimized-dup-deps-package-b'

// should get test-package-a:test-package-b-v2
const result = 'test-package-a:' + b

export default result
