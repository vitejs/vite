async function crash(): Promise<void> {
  await Promise.resolve()
  throw new Error('crash')
}

export async function main(): Promise<void> {
  await Promise.all([crash()])
}
