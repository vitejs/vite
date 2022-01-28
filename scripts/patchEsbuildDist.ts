// esbuild 0.14.4 https://github.com/evanw/esbuild/blob/master/CHANGELOG.md#0144 introduced a
// change that breaks the "overwrite for cjs require('...')() usage" hack used in plugin-vue
// and plugin-react. For the moment, we can remove the extra exports code added in 0.14.4 to
// continue using it.

import { bold, red } from 'picocolors'
import { readFileSync, writeFileSync } from 'fs'

const indexPath = process.argv[2]
const varName = process.argv[3]

let code = readFileSync(indexPath, 'utf-8')

const moduleExportsLine = `module.exports = __toCommonJS(src_exports);`

if (code.includes(moduleExportsLine)) {
  // overwrite for cjs require('...')() usage
  code = code.replace(
    moduleExportsLine,
    `module.exports = ${varName};
${varName}['default'] = ${varName};`
  )

  writeFileSync(indexPath, code)

  console.log(
    bold(`${indexPath} patched with overwrite for cjs require('...')()`)
  )
} else {
  console.error(red(`${indexPath} post-esbuild bundling patch failed`))
}
