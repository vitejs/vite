import { expect, test } from 'vitest'
import type { InternalModuleFormat } from 'rolldown'
import { resolveConfig } from '../../config'
import { buildOxcPlugin } from '../../plugins/oxc'
import { PartialEnvironment } from '../../baseEnvironment'

async function createBuildOxcPluginRenderChunk(target: string) {
  const config = await resolveConfig(
    { build: { target }, configFile: false },
    'build',
  )
  const instance = buildOxcPlugin()
  const environment = new PartialEnvironment('client', config)

  return async (code: string, format: InternalModuleFormat) => {
    // @ts-expect-error renderChunk should exist
    const result = await instance.renderChunk.call(
      { environment },
      code,
      {
        fileName: 'foo.ts',
      },
      { format },
    )
    return result?.code || result
  }
}

test('should inject helper for worker iife from esm', async () => {
  const renderChunk = await createBuildOxcPluginRenderChunk('es2015')
  const result = await renderChunk(
    `(function() {

"use strict";

//#region src/index.js
(async () => {
	await new Promise((resolve) => setTimeout(resolve, 1e3));
	console.log("foo");
})();

//#endregion
})();`,
    'iife',
  )
  expect(result).toMatchInlineSnapshot(`
    "(function() {
    	"use strict";var babelHelpers=function(exports){function t(e,t,n,r,i,a,o){try{var s=e[a](o),c=s.value}catch(e){return void n(e)}s.done?t(c):Promise.resolve(c).then(r,i)}function n(e){return function(){var n=this,r=arguments;return new Promise(function(i,a){var o=e.apply(n,r);function s(e){t(o,i,a,s,c,\`next\`,e)}function c(e){t(o,i,a,s,c,\`throw\`,e)}s(void 0)})}}return exports.asyncToGenerator=n,exports}({});

    	//#region src/index.js
    	babelHelpers.asyncToGenerator(function* () {
    		yield new Promise((resolve) => setTimeout(resolve, 1e3));
    		console.log("foo");
    	})();
    	//#endregion
    })();
    "
  `)
})

test('should inject helper for worker iife from cjs', async () => {
  const renderChunk = await createBuildOxcPluginRenderChunk('es2015')
  const result = await renderChunk(
    `(function() {


//#region src/index.js
(async () => {
	await new Promise((resolve) => setTimeout(resolve, 1e3));
	console.log("foo");
})();

//#endregion
})();`,
    'iife',
  )
  expect(result).toMatchInlineSnapshot(`
    "(function() {var babelHelpers=function(exports){function t(e,t,n,r,i,a,o){try{var s=e[a](o),c=s.value}catch(e){return void n(e)}s.done?t(c):Promise.resolve(c).then(r,i)}function n(e){return function(){var n=this,r=arguments;return new Promise(function(i,a){var o=e.apply(n,r);function s(e){t(o,i,a,s,c,\`next\`,e)}function c(e){t(o,i,a,s,c,\`throw\`,e)}s(void 0)})}}return exports.asyncToGenerator=n,exports}({});

    	//#region src/index.js
    	babelHelpers.asyncToGenerator(function* () {
    		yield new Promise((resolve) => setTimeout(resolve, 1e3));
    		console.log("foo");
    	})();
    	//#endregion
    })();
    "
  `)
})
