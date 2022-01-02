import type { ModuleInfo, ResolvedId } from 'rollup'
import {
  buildVendorAnalysisPlugin,
  exportFromRE,
  importRE,
  splitAsRE
} from '../../plugins/vendorAnalysis'

describe('regexp tests', () => {
  const [, exps] = 'export { default, foo as bar } from "foo.js"'.match(
    exportFromRE
  )
  const [, expsMulti] = `export {
    default,
    foo as bar
  } from "foo.js"`.match(exportFromRE)

  test('export from', () => {
    expect(exps.trim()).toBe('default, foo as bar')
    expect(expsMulti.trim()).toBe('default,\n    foo as bar')
  })

  test('split as', () => {
    const [exp1, exp2] = expsMulti.split(',')

    const [, impName1, alias1] = exp1.trim().match(splitAsRE) || []
    expect(impName1).toBe('default')
    expect(alias1).toBeFalsy()

    const [, impName2, alias2] = exp2.trim().match(splitAsRE) || []
    expect(impName2).toBe('foo')
    expect(alias2).toBe('bar')
  })

  test('import', () => {
    const [, impDef, imps] =
      'import def, { foo, bar as alias } from "foo.js"'.match(importRE) || []
    expect(impDef).toBe('def')
    expect(imps).toBe(' foo, bar as alias ')
  })
})

describe('plugin mock', () => {
  test('disable when manualChunks is set', () => {
    const plugin = buildVendorAnalysisPlugin()

    expect(
      plugin.outputOptions.call(
        {},
        { manualChunks: undefined, __vite_vendor_chunk__: true }
      )
    ).toBeUndefined()
  })

  test('disable when __vite_vendor_chunk__ is false', () => {
    const plugin = buildVendorAnalysisPlugin()

    expect(
      plugin.outputOptions.call({}, { __vite_vendor_chunk__: false })
    ).toBeUndefined()
  })

  test('in vendor or not', async () => {
    const plugin = buildVendorAnalysisPlugin()

    const modules = {
      '/index.js': `
        import { bar } from 'dep'
      `,
      '/node_modules/dep/index.js': `
        export { foo as bar } from 'dep1'
        export { foo } from 'dep2'
      `,
      '/node_modules/dep/dep1.js': `
        export * from 'dep3'
      `,
      '/node_modules/dep/dep2.js': `
        export default 0
        export const foo = 1
      `,
      '/node_modules/dep/dep3.js': `
        export default 2
        export const foo = 3
      `
    }

    const moduleIds = Object.keys(modules)

    const resolveMap = {
      dep: '/node_modules/dep/index.js',
      dep1: '/node_modules/dep/dep1.js',
      dep2: '/node_modules/dep/dep2.js',
      dep3: '/node_modules/dep/dep3.js'
    }

    const getModuleInfo = (id: string): ModuleInfo | null => {
      if (!(id in modules)) return null
      const code = modules[id]
      return {
        id,
        code,
        isEntry: id === '/index.js'
      } as ModuleInfo
    }

    const resolve = async (
      imp: string,
      importer: string
    ): Promise<ResolvedId | null> => {
      if (!(imp in resolveMap)) return null
      return {
        id: resolveMap[imp]
      } as ResolvedId
    }

    const getModuleIds = () => moduleIds

    await plugin.buildEnd.call({
      getModuleInfo,
      resolve,
      getModuleIds
    })

    const manualChunks = plugin.outputOptions.call(
      {},
      { __vite_vendor_chunk__: true }
    ).manualChunks as (id: string) => string | undefined

    // it's a source module, not a vendor module
    expect(manualChunks('/index.js')).toBeUndefined()
    // dep shouldn't be a vendor chunk since it's just redirects
    expect(manualChunks('/node_modules/dep/index.js')).toBeUndefined()
    // dep1 shouldn't since it just redirects dep3
    expect(manualChunks('/node_modules/dep/dep1.js')).toBeUndefined()
    // dep2 shouldn't since it's not imported by index.js
    expect(manualChunks('/node_modules/dep/dep2.js')).toBeUndefined()
    // dep3 should be a vendor chunk
    expect(manualChunks('/node_modules/dep/dep3.js')).toBe('vendor')
  })
})
