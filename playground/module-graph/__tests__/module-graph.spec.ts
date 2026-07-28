import { expect, test } from 'vitest'
import { isBundledDev, isServe, page, viteServer } from '~utils'

// bundled dev by design: server.moduleGraph stays empty — the rolldown
// bundle owns the module graph
test.runIf(isServe && !isBundledDev)(
  'importedUrls order is preserved',
  async () => {
    const el = page.locator('.imported-urls-order')
    expect(await el.textContent()).toBe('[success]')
    const mod = await viteServer.environments.client.moduleGraph.getModuleByUrl(
      '/imported-urls-order.js',
    )
    const importedModuleIds = [...mod.importedModules].map((m) => m.url)
    expect(importedModuleIds).toEqual(['\x00virtual:slow-module', '/empty.js'])
  },
)
