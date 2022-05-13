/**

It converts

```ts
exports["default"] = vuePlugin;
exports.parseVueRequest = parseVueRequest;
```

to

```ts
module.exports = vuePlugin;
module.exports["default"] = vuePlugin;
module.exports.parseVueRequest = parseVueRequest;
```
*/

import { readFileSync, writeFileSync } from 'fs'
import colors from 'picocolors'

const indexPath = 'dist/index.cjs'
let code = readFileSync(indexPath, 'utf-8')

const matchMixed = code.match(/\nexports\["default"\] = (\w+);/)
if (matchMixed) {
  const name = matchMixed[1]

  const lines = code.trimEnd().split('\n')

  // search from the end to prepend `modules.` to `export[xxx]`
  for (let i = lines.length - 1; i > 0; i--) {
    if (lines[i].startsWith('exports')) lines[i] = 'module.' + lines[i]
    else {
      // at the beginning of exports, export the default function
      lines[i] += `\nmodule.exports = ${name};`
      break
    }
  }

  writeFileSync(indexPath, lines.join('\n'))

  console.log(colors.bold(`${indexPath} CJS patched`))
  process.exit()
}

const matchDefault = code.match(/\nmodule.exports = (\w+);/)

if (matchDefault) {
  code += `module.exports["default"] = ${matchDefault[1]};\n`
  writeFileSync(indexPath, code)
  console.log(colors.bold(`${indexPath} CJS patched`))
  process.exit()
}

console.error(colors.red(`${indexPath} CJS patch failed`))
process.exit(1)
