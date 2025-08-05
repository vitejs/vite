import { describe, expect, test } from 'vitest'
import { isBuild, serverLogs } from '~utils'

// Test for CSS image-set warning issue (PR #20520)
// This test ensures that when CSS contains image-set() with url() functions,
// and those URLs get processed to __VITE_ASSET__ tokens, subsequent image-set
// processing doesn't try to resolve the tokens again, which would cause warnings.
test.runIf(isBuild)(
  'should not warn about VITE_ASSET tokens in image-set',
  async () => {
    // The warning we're looking for:
    // "__VITE_ASSET__xxx__ referenced in __VITE_ASSET__xxx__ didn't resolve at build time"

    const warningPattern = /VITE_ASSET__.*?didn't resolve at build time/
    const warningLogs = serverLogs.filter((log) => warningPattern.test(log))

    // The issue occurs when:
    // 1. CSS has image-set with url() functions
    // 2. URL processing converts URLs to __VITE_ASSET__ tokens
    // 3. Image-set processing then tries to process the tokens again
    // 4. This causes false warnings since tokens can't be resolved as files

    // With the fix in skipUrlReplacer(), asset tokens should be skipped
    expect(warningLogs.length).toBe(0)
  },
)
