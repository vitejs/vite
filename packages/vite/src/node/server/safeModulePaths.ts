import { cleanUrl } from '../../shared/utils'

export class SafeModulePaths extends Set<string> {
  addUrl(url: string): void {
    this.add(url)
    this.add(cleanUrl(url))
  }
}
