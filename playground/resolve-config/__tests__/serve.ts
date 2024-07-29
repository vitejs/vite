// this is automatically detected by playground/vitestSetup.ts and will replace
// the default e2e test serve behavior

import fs from 'node:fs/promises'
import path from 'node:path'
import { isBuild, rootDir } from '~utils'

const configNames = ['js', 'cjs', 'mjs', 'ts', 'mts', 'cts']

export async function serve() {
  if (!isBuild) return

  const fromTestDir = (...p: string[]) => path.resolve(rootDir, '..', ...p)

  // create separate directories for all config types:
  // ./{js,cjs,mjs,ts} and ./{js,cjs,mjs,ts}-module (with package#type)
  for (const configName of configNames) {
    const pathToConf = fromTestDir(configName, `vite.config.${configName}`)

    await fs.cp(fromTestDir('root'), fromTestDir(configName), {
      recursive: true,
    })
    await fs.rename(fromTestDir(configName, 'vite.config.ts'), pathToConf)

    if (['cjs', 'cts'].includes(configName)) {
      const conf = await fs.readFile(pathToConf, 'utf-8')
      await fs.writeFile(
        pathToConf,
        conf.replace('export default', 'module.exports = '),
      )
    }

    // Remove TS annotation for plain JavaScript file.
    if (configName.endsWith('js')) {
      const conf = await fs.readFile(pathToConf, 'utf-8')
      await fs.writeFile(pathToConf, conf.replace(': boolean', ''))
    }

    // copy directory and add package.json with "type": "module"
    await fs.cp(fromTestDir(configName), fromTestDir(`${configName}-module`), {
      recursive: true,
    })
    await fs.writeFile(
      fromTestDir(`${configName}-module`, 'package.json'),
      '{ "type": "module" }',
    )
  }
}
