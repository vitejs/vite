import { describe, expect, it } from 'vitest'
import { ModuleNode, getModuleNodeHash } from '../moduleGraph'
import { propagateUpdate } from '../hmr'
import { HashSet } from '../hashset'

describe('hmr', () => {
  it('should return early if there is a circular update', () => {
    const node = new ModuleNode('/x.js')
    node.importers.add(node)

    const boundaries = new HashSet<{
      boundary: ModuleNode
      acceptedVia: ModuleNode
    }>({
      getHash: ({ boundary, acceptedVia }) =>
        `${getModuleNodeHash(boundary)}:${getModuleNodeHash(acceptedVia)}`,
    })

    const previousChain = [new ModuleNode('/x.js')]

    expect(propagateUpdate(node, boundaries, previousChain)).toBe(true)
  })
})
