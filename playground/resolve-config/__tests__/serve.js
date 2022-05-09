// @ts-check
// this is automtically detected by scripts/jestPerTestSetup.ts and will replace
// the default e2e test serve behavior

const path = require('path')
const fs = require('fs-extra')
const { testDir } = require('../../testUtils')

const fromTestDir = (/** @type{string[]} */ ...p) => path.resolve(testDir, ...p)

const configNames = ['js', 'cjs', 'mjs', 'ts']

/** @param {string} root @param {boolean} isProd */
exports.serve = async function serve(root, isProd) {
  if (!isProd) return

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
