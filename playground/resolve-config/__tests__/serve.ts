// this is automatically detected by playground/vitestSetup.ts and will replace
// the default e2e test serve behavior

import path from 'path'
import fs from 'fs-extra'
import { isBuild, rootDir } from '~utils'

const configNames = ['js', 'cjs', 'mjs', 'ts']

export async function serve() {
  if (!isBuild) return

  const fromTestDir = (...p: string[]) => path.resolve(rootDir, '..', ...p)

  // create separate directories for all config types:
  // ./{js,cjs,mjs,ts} and ./{js,cjs,mjs,ts}-module (with package#type)
  for (const configName of configNames) {
    const pathToConf = fromTestDir(configName, `vite.config.${configName}`)

    await fs.copy(fromTestDir('root'), fromTestDir(configName))
    await fs.rename(fromTestDir(configName, 'vite.config.js'), pathToConf)

    if (configName === 'cjs') {
      const conf = await fs.readFile(pathToConf, 'utf8')
      await fs.writeFile(
        pathToConf,
        conf.replace('export default', 'module.exports = ')
      )
    }

    // copy directory and add package.json with "type": "module"
    await fs.copy(fromTestDir(configName), fromTestDir(`${configName}-module`))
    await fs.writeJSON(fromTestDir(`${configName}-module`, 'package.json'), {
      type: 'module'
    })
  }
}
