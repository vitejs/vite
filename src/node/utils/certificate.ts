// https://github.com/webpack/webpack-dev-server/blob/master/lib/utils/createCertificate.js
import path from 'path'
import fs from 'fs-extra'
import { getIpV4Addresses } from './getIpV4Addresses'

const certificateTtl = 30
const dayMs = 1000 * 60 * 60 * 24

function createCertificate() {
  const pems = require('selfsigned').generate(null, {
    algorithm: 'sha256',
    days: certificateTtl,
    keySize: 2048,
    extensions: [
      // {
      //   name: 'basicConstraints',
      //   cA: true,
      // },
      {
        name: 'keyUsage',
        keyCertSign: true,
        digitalSignature: true,
        nonRepudiation: true,
        keyEncipherment: true,
        dataEncipherment: true
      },
      {
        name: 'extKeyUsage',
        serverAuth: true,
        clientAuth: true,
        codeSigning: true,
        timeStamping: true
      },
      {
        name: 'subjectAltName',
        altNames: [
          {
            // type 2 is DNS
            type: 2,
            value: 'localhost'
          },
          {
            type: 2,
            value: 'localhost.localdomain'
          },
          {
            type: 2,
            value: 'lvh.me'
          },
          {
            type: 2,
            value: '*.lvh.me'
          },
          {
            type: 2,
            value: '[::1]'
          },
          {
            // type 7 is IP
            type: 7,
            ip: '127.0.0.1'
          },
          ...getIpV4Addresses().map((network) => {
            return { type: 7, ip: network.address }
          }),
          {
            type: 7,
            ip: 'fe80::1'
          }
        ]
      }
    ]
  })
  return pems.private + pems.cert
}

export function getCertificate(root: string) {
  const certificatePath = path.join(root, 'server.pem')

  if (fs.existsSync(certificatePath)) {
    const certificateStat = fs.statSync(certificatePath)
    if (
      (new Date().getTime() - certificateStat.ctime.getTime()) / dayMs <
      certificateTtl
    ) {
      console.log(`read certificate from ${certificatePath}`)
      return fs.readFileSync(certificatePath)
    }
    console.log(`Certificate is more than ${certificateTtl} days`)
  }

  const certificate = createCertificate()
  fs.writeFileSync(certificatePath, certificate, {
    encoding: 'utf8'
  })
  console.log(`created ssl cert at ${certificatePath}`)
  return certificate
}
