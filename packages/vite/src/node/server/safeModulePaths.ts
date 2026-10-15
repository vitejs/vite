import { cleanUrl } from '../../shared/utils'

export class SafeModulePaths extends Set<string> {
  addId(id: string): void {
    // Transform access checks validate both the full ID and its cleaned file
    // path, so imports with queries need both in the allow list.
    this.add(id)
    this.add(cleanUrl(id))
  }
}
