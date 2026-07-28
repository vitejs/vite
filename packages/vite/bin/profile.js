export function removeProfileFlag(argv) {
  const profileIndex = argv.indexOf('--profile')
  if (profileIndex > 0) {
    argv.splice(profileIndex, 1)
  }
  return profileIndex
}
