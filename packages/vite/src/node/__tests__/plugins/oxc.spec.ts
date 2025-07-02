import path from 'node:path'
import { describe, expect, test } from 'vitest'
import type { InternalModuleFormat } from 'rolldown'
import { resolveConfig } from '../../config'
import { buildOxcPlugin, transformWithOxc } from '../../plugins/oxc'
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

describe('transformWithOxc', () => {
  test('correctly overrides TS configuration and applies automatic transform', async () => {
    const jsxImportSource = 'bar'
    const result = await transformWithOxc(
      'const foo = () => <></>',
      path.resolve(
        import.meta.dirname,
        './fixtures/oxc-tsconfigs/jsx-preserve/baz.jsx',
      ),
      {
        jsx: {
          runtime: 'automatic',
          importSource: jsxImportSource,
        },
      },
    )
    expect(result?.code).toContain(`${jsxImportSource}/jsx-runtime`)
    expect(result?.code).toContain('/* @__PURE__ */')
  })

  test('correctly overrides TS configuration and preserves code', async () => {
    const foo = 'const foo = () => <></>'
    const result = await transformWithOxc(
      foo,
      path.resolve(
        import.meta.dirname,
        './fixtures/oxc-tsconfigs/jsx-react-jsx/baz.jsx',
      ),
      {
        jsx: 'preserve',
      },
    )
    expect(result?.code).toContain(foo)
  })

  test('correctly overrides TS configuration and transforms code', async () => {
    const jsxFactory = 'h',
      jsxFragment = 'bar'
    const result = await transformWithOxc(
      'const foo = () => <></>',
      path.resolve(
        import.meta.dirname,
        './fixtures/oxc-tsconfigs/jsx-complex-options/baz.jsx',
      ),
      {
        jsx: {
          runtime: 'classic',
          pragma: jsxFactory,
          pragmaFrag: jsxFragment,
        },
      },
    )
    expect(result?.code).toContain(
      `/* @__PURE__ */ ${jsxFactory}(${jsxFragment}, null)`,
    )
  })

  describe('useDefineForClassFields', async () => {
    const transformClassCode = async (target: string, tsconfigDir: string) => {
      const result = await transformWithOxc(
        `
          class foo {
            bar = 'bar'
          }
        `,
        path.resolve(import.meta.dirname, tsconfigDir, './bar.ts'),
        { target },
      )
      return result?.code
    }

    const [
      defineForClassFieldsTrueTransformedCode,
      defineForClassFieldsTrueLowerTransformedCode,
      defineForClassFieldsFalseTransformedCode,
    ] = await Promise.all([
      transformClassCode('esnext', './fixtures/oxc-tsconfigs/use-define-true'),
      transformClassCode('es2021', './fixtures/oxc-tsconfigs/use-define-true'),
      transformClassCode('esnext', './fixtures/oxc-tsconfigs/use-define-false'),
    ])

    test('target: esnext and tsconfig.target: esnext => true', async () => {
      const actual = await transformClassCode(
        'esnext',
        './fixtures/oxc-tsconfigs/target-esnext',
      )
      expect(actual).toBe(defineForClassFieldsTrueTransformedCode)
    })

    test('target: es2021 and tsconfig.target: esnext => true', async () => {
      const actual = await transformClassCode(
        'es2021',
        './fixtures/oxc-tsconfigs/target-esnext',
      )
      expect(actual).toBe(defineForClassFieldsTrueLowerTransformedCode)
    })

    test('target: es2021 and tsconfig.target: es2021 => false', async () => {
      const actual = await transformClassCode(
        'es2021',
        './fixtures/oxc-tsconfigs/target-es2021',
      )
      expect(actual).toBe(defineForClassFieldsFalseTransformedCode)
    })

    test('target: esnext and tsconfig.target: es2021 => false', async () => {
      const actual = await transformClassCode(
        'esnext',
        './fixtures/oxc-tsconfigs/target-es2021',
      )
      expect(actual).toBe(defineForClassFieldsFalseTransformedCode)
    })

    test('target: es2022 and tsconfig.target: es2022 => true', async () => {
      const actual = await transformClassCode(
        'es2022',
        './fixtures/oxc-tsconfigs/target-es2022',
      )
      expect(actual).toBe(defineForClassFieldsTrueTransformedCode)
    })

    test('target: es2022 and tsconfig.target: undefined => false', async () => {
      const actual = await transformClassCode(
        'es2022',
        './fixtures/oxc-tsconfigs/empty',
      )
      expect(actual).toBe(defineForClassFieldsFalseTransformedCode)
    })
  })
})

describe('renderChunk', () => {
  test('should inject helper for iife without exports from esm', async () => {
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

  test('should inject helper for iife without exports from cjs', async () => {
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

  test('should inject helper for iife with exports', async () => {
    const renderChunk = await createBuildOxcPluginRenderChunk('es2015')
    const result = await renderChunk(
      `var lib = (function(exports) {


//#region entry.js
(async () => {
	await new Promise((resolve) => setTimeout(resolve, 1e3));
	console.log("foo");
})();
const foo = "foo";

//#endregion
exports.foo = foo;
return exports;
})({});`,
      'iife',
    )
    expect(result).toMatchInlineSnapshot(`
      "var lib = function(exports) {var babelHelpers=function(exports){function t(e,t,n,r,i,a,o){try{var s=e[a](o),c=s.value}catch(e){return void n(e)}s.done?t(c):Promise.resolve(c).then(r,i)}function n(e){return function(){var n=this,r=arguments;return new Promise(function(i,a){var o=e.apply(n,r);function s(e){t(o,i,a,s,c,\`next\`,e)}function c(e){t(o,i,a,s,c,\`throw\`,e)}s(void 0)})}}return exports.asyncToGenerator=n,exports}({});

      	//#region entry.js
      	babelHelpers.asyncToGenerator(function* () {
      		yield new Promise((resolve) => setTimeout(resolve, 1e3));
      		console.log("foo");
      	})();
      	const foo = "foo";
      	//#endregion
      	exports.foo = foo;
      	return exports;
      }({});
      "
    `)
  })

  test('should inject helper for umd without exports', async () => {
    const renderChunk = await createBuildOxcPluginRenderChunk('es2015')
    const result = await renderChunk(
      `(function(factory) {

  typeof define === 'function' && define.amd ? define([], factory) :
  factory();
})(function() {

//#region entry.js
(async () => {
	await new Promise((resolve) => setTimeout(resolve, 1e3));
	console.log("foo");
})();

//#endregion
});`,
      'umd',
    )
    expect(result).toMatchInlineSnapshot(`
      "(function(factory) {
      	typeof define === "function" && define.amd ? define([], factory) : factory();
      })(function() {var babelHelpers=function(exports){function t(e,t,n,r,i,a,o){try{var s=e[a](o),c=s.value}catch(e){return void n(e)}s.done?t(c):Promise.resolve(c).then(r,i)}function n(e){return function(){var n=this,r=arguments;return new Promise(function(i,a){var o=e.apply(n,r);function s(e){t(o,i,a,s,c,\`next\`,e)}function c(e){t(o,i,a,s,c,\`throw\`,e)}s(void 0)})}}return exports.asyncToGenerator=n,exports}({});

      	//#region entry.js
      	babelHelpers.asyncToGenerator(function* () {
      		yield new Promise((resolve) => setTimeout(resolve, 1e3));
      		console.log("foo");
      	})();
      	//#endregion
      });
      "
    `)
  })

  test('should inject helper for umd with exports', async () => {
    const renderChunk = await createBuildOxcPluginRenderChunk('es2015')
    const result = await renderChunk(
      `(function(global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ?  factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global.lib = {})));
})(this, function(exports) {

//#region entry.js
(async () => {
	await new Promise((resolve) => setTimeout(resolve, 1e3));
	console.log("foo");
})();
const foo = "foo";

//#endregion
exports.foo = foo;
});`,
      'umd',
    )
    expect(result).toMatchInlineSnapshot(`
      "(function(global, factory) {
      	typeof exports === "object" && typeof module !== "undefined" ? factory(exports) : typeof define === "function" && define.amd ? define(["exports"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory(global.lib = {}));
      })(this, function(exports) {var babelHelpers=function(exports){function t(e,t,n,r,i,a,o){try{var s=e[a](o),c=s.value}catch(e){return void n(e)}s.done?t(c):Promise.resolve(c).then(r,i)}function n(e){return function(){var n=this,r=arguments;return new Promise(function(i,a){var o=e.apply(n,r);function s(e){t(o,i,a,s,c,\`next\`,e)}function c(e){t(o,i,a,s,c,\`throw\`,e)}s(void 0)})}}return exports.asyncToGenerator=n,exports}({});

      	//#region entry.js
      	babelHelpers.asyncToGenerator(function* () {
      		yield new Promise((resolve) => setTimeout(resolve, 1e3));
      		console.log("foo");
      	})();
      	const foo = "foo";
      	//#endregion
      	exports.foo = foo;
      });
      "
    `)
  })

  test('should inject helper for umd with only default export', async () => {
    const renderChunk = await createBuildOxcPluginRenderChunk('es2015')
    const result = await renderChunk(
      `(function(global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports =  factory() :
  typeof define === 'function' && define.amd ? define([], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, (global.lib = factory()));
})(this, function() {

//#region entry.js
(async () => {
	await new Promise((resolve) => setTimeout(resolve, 1e3));
	console.log("foo");
})();
var index_default = "foo";

//#endregion
return index_default;
});`,
      'umd',
    )
    expect(result).toMatchInlineSnapshot(`
      "(function(global, factory) {
      	typeof exports === "object" && typeof module !== "undefined" ? module.exports = factory() : typeof define === "function" && define.amd ? define([], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, global.lib = factory());
      })(this, function() {var babelHelpers=function(exports){function t(e,t,n,r,i,a,o){try{var s=e[a](o),c=s.value}catch(e){return void n(e)}s.done?t(c):Promise.resolve(c).then(r,i)}function n(e){return function(){var n=this,r=arguments;return new Promise(function(i,a){var o=e.apply(n,r);function s(e){t(o,i,a,s,c,\`next\`,e)}function c(e){t(o,i,a,s,c,\`throw\`,e)}s(void 0)})}}return exports.asyncToGenerator=n,exports}({});

      	//#region entry.js
      	babelHelpers.asyncToGenerator(function* () {
      		yield new Promise((resolve) => setTimeout(resolve, 1e3));
      		console.log("foo");
      	})();
      	var index_default = "foo";
      	//#endregion
      	return index_default;
      });
      "
    `)
  })
})
