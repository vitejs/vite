/**
This patch is needed when the package exports both a default and named export.

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
import { bold, red } from 'picocolors'

const indexPath = 'dist/index.cjs'
const code = readFileSync(indexPath, 'utf-8')

const match = code.match(/\nexports\["default"\] = (\w+);/)

if (match) {
  const name = match[1]

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

  console.log(bold(`${indexPath} CJS patched`))
} else {
  console.error(red(`${indexPath} CJS patch failed`))
}
