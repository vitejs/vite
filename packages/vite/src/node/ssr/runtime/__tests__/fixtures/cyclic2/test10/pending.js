// stays pending until the test resolves it
globalThis.__viteTestPending__.started()
await globalThis.__viteTestPending__.promise
