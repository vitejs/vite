/**
 * module H
 */
export async function commonModuleExport() {
  const [{ stuckModuleExport }, { deadlockfuseModuleExport }] =
    await Promise.all([
      import('./stuck-module'),
      import('./deadlock-fuse-module'),
    ])

  stuckModuleExport()
  deadlockfuseModuleExport()
}
