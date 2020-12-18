import path from 'path'
import slash from 'slash'
import hash from 'hash-sum'
import { SFCDescriptor } from '@vue/compiler-sfc'

export function genScopeId(
  descriptor: SFCDescriptor,
  root: string,
  isProduction = false
) {
  // ensure the path is normalized in a way that is consistent inside
  // project (relative to root) and on different systems.
  const normalizedPath = slash(
    path.normalize(path.relative(root, descriptor.filename))
  )
  return hash(normalizedPath + (isProduction ? descriptor.source : ''))
}
