export async function main() {
  const mod = await import('./dep.mjs')
  console.log(mod)
}
