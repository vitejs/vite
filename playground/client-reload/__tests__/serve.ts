// do nothing here since server is managed inside spec
export async function serve(): Promise<{ close(): Promise<void> }> {
  return {
    close: () => Promise.resolve(),
  }
}
