export async function test() {
  try {
    const result = await import('test-dep-invalid-exports')
    return { ok: true, data: result }
  } catch (e) {
    return { ok: false, data: e }
  }
}
