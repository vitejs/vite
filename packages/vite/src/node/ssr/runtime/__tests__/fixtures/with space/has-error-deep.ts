function crash(message: string) {
  throw new Error(message)
}

export function main(): void {
  crash('crash')
}
