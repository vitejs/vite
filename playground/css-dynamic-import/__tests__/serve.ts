// this is automatically detected by playground/vitestSetup.ts and will replace
// the default e2e test serve behavior

// The server is started in the test, so we need to have a custom serve
// function or a default server will be created
export async function serve() {
  return {
    close: () => Promise.resolve(),
  }
}
