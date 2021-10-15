import _debug from 'debug'
import {
  createDescriptor,
  getDescriptor,
  setPrevDescriptor,
} from './utils/descriptorCache'
import { ModuleNode, HmrContext } from 'vite'
import { ResolvedOptions } from './index'
import { SFCBlock } from '@vue/component-compiler-utils'

const debug = _debug('vite:hmr')

/**
 * Vite-specific HMR handling
 */
export async function handleHotUpdate(
  { file, modules, read, server }: HmrContext,
  options: ResolvedOptions
): Promise<ModuleNode[] | void> {
  const prevDescriptor = getDescriptor(file, false)
  if (!prevDescriptor) {
    // file hasn't been requested yet (e.g. async component)
    return
  }

  setPrevDescriptor(file, prevDescriptor)

  const content = await read()
  const descriptor = createDescriptor(content, file, options)

  let needRerender = false
  const affectedModules = new Set<ModuleNode | undefined>()
  const mainModule = modules.find(
    (m) => !/type=/.test(m.url) || /type=script/.test(m.url)
  )
  const templateModule = modules.find((m) => /type=template/.test(m.url))

  if (!isEqualBlock(descriptor.script, prevDescriptor.script)) {
    let scriptModule: ModuleNode | undefined
    if (descriptor.script?.lang && !descriptor.script.src) {
      const scriptModuleRE = new RegExp(
        `type=script.*&lang\.${descriptor.script.lang}$`
      )
      scriptModule = modules.find((m) => scriptModuleRE.test(m.url))
    }
    affectedModules.add(scriptModule || mainModule)
  }

  if (!isEqualBlock(descriptor.template, prevDescriptor.template)) {
    affectedModules.add(templateModule)
    needRerender = true
  }

  let didUpdateStyle = false
  const prevStyles = prevDescriptor.styles || []
  const nextStyles = descriptor.styles || []

  // force reload if scoped status has changed
  if (prevStyles.some((s) => s.scoped) !== nextStyles.some((s) => s.scoped)) {
    // template needs to be invalidated as well
    affectedModules.add(templateModule)
    affectedModules.add(mainModule)
  }

  // only need to update styles if not reloading, since reload forces
  // style updates as well.
  for (let i = 0; i < nextStyles.length; i++) {
    const prev = prevStyles[i]
    const next = nextStyles[i]
    if (!prev || !isEqualBlock(prev, next)) {
      didUpdateStyle = true
      const mod = modules.find((m) => m.url.includes(`type=style&index=${i}`))
      if (mod) {
        affectedModules.add(mod)
      } else {
        // new style block - force reload
        affectedModules.add(mainModule)
      }
    }
  }
  if (prevStyles.length > nextStyles.length) {
    // style block removed - force reload
    affectedModules.add(mainModule)
  }

  const prevCustoms = prevDescriptor.customBlocks || []
  const nextCustoms = descriptor.customBlocks || []

  // custom blocks update causes a reload
  // because the custom block contents is changed and it may be used in JS.
  if (prevCustoms.length !== nextCustoms.length) {
    // block rmeoved/added, force reload
    affectedModules.add(mainModule)
  } else {
    for (let i = 0; i < nextCustoms.length; i++) {
      const prev = prevCustoms[i]
      const next = nextCustoms[i]
      if (!prev || !isEqualBlock(prev, next)) {
        const mod = modules.find((m) =>
          m.url.includes(`type=${prev.type}&index=${i}`)
        )
        if (mod) {
          affectedModules.add(mod)
        } else {
          affectedModules.add(mainModule)
        }
      }
    }
  }

  let updateType = []
  if (needRerender) {
    updateType.push(`template`)
    // template is inlined into main, add main module instead
    if (!templateModule) {
      affectedModules.add(mainModule)
    }
  }
  if (didUpdateStyle) {
    updateType.push(`style`)
  }
  if (updateType.length) {
    debug(`[vue:update(${updateType.join('&')})] ${file}`)
  }
  return [...affectedModules].filter(Boolean) as ModuleNode[]
}

function isEqualBlock(a: SFCBlock | null, b: SFCBlock | null) {
  if (!a && !b) return true
  if (!a || !b) return false
  // src imports will trigger their own updates
  if (a.src && b.src && a.src === b.src) return true
  if (a.content !== b.content) return false
  const keysA = Object.keys(a.attrs)
  const keysB = Object.keys(b.attrs)
  if (keysA.length !== keysB.length) {
    return false
  }
  return keysA.every((key) => a.attrs[key] === b.attrs[key])
}
