import { describe, expect, test } from 'vitest'
import { completeAmdWrapPlugin } from '../../plugins/completeAmdWrap'

async function createCompleteAmdWrapPluginRenderChunk() {
  const instance = completeAmdWrapPlugin()

  return async (code: string) => {
    // @ts-expect-error transform.handler should exist
    const result = await instance.renderChunk.call(instance, code, 'foo.ts', {
      format: 'amd',
    })
    return result?.code || result
  }
}

describe('completeAmdWrapPlugin', async () => {
  const renderChunk = await createCompleteAmdWrapPluginRenderChunk()

  describe('adds require parameter', async () => {
    test('without other dependencies', async () => {
      expect(
        await renderChunk('define((function() { } ))'),
      ).toMatchInlineSnapshot(`"define(["require"], (function(require) { } ))"`)
    })

    test('with other dependencies', async () => {
      expect(
        await renderChunk(
          'define(["vue", "vue-router"], function(vue, vueRouter) { } ))',
        ),
      ).toMatchInlineSnapshot(
        `"define(["require", "vue", "vue-router"], (function(require, vue, vueRouter) { } ))"`,
      )
    })

    test("only if require isn't injected already", async () => {
      expect(
        await renderChunk('define(["require"], function(require) { } ))'),
      ).toMatchInlineSnapshot(`"define(["require"], (function(require) { } ))"`)
    })
  })
})
