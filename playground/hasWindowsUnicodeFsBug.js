import os from 'node:os'

const isWindows = os.platform() === 'win32'
const nodeVersionArray = process.versions.node.split('.')
// ignore some files due to https://github.com/nodejs/node/issues/48673
// node <=21.0.0 and ^20.4.0 has the bug
export const hasWindowsUnicodeFsBug =
  isWindows &&
  (+nodeVersionArray[0] > 20 ||
    (+nodeVersionArray[0] === 20 && +nodeVersionArray[1] >= 4))
