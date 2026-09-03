import { deadlockfuseModuleExport } from './deadlock-fuse-module'
import { stuckModuleExport } from './stuck-module'

/**
 * module H
 */
export function commonModuleExport() {
  stuckModuleExport()
  deadlockfuseModuleExport()
}
