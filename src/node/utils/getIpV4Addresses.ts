import os, { NetworkInterfaceInfoIPv4 } from 'os'

export function getIpV4Addresses(): NetworkInterfaceInfoIPv4[] {
  return Object.values(os.networkInterfaces())
    .filter((i) => !!i)
    .reduce((pre, cur) => (pre = pre!.concat(cur!)), [])!
    .filter((d) => d.family === 'IPv4') as NetworkInterfaceInfoIPv4[]
}
