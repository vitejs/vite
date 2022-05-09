// Simplified fork of selfsigned with inlined options and partial
// node-forge usage to achieve smaller bundle. See:
// https://github.com/jfromaniello/selfsigned/blob/da38146f8d02183c35f49f91659a744a243e8707/index.js
//
// this utility create untrusted certificate which still
// allows to access page after proceeding a wall with warning
//
// should be deprecated eventually and replaced with recipes
// about generating secure trusted certificates
//
// ## selfsigned
// License: MIT
// By: José F. Romaniello, Paolo Fragomeni, Charles Bushong
// Repository: git://github.com/jfromaniello/selfsigned.git
// MIT License
// Copyright (c) 2013 José F. Romaniello
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

// @ts-ignore
import forge from 'node-forge/lib/forge'
// @ts-ignore
import 'node-forge/lib/pki'

// a hexString is considered negative if it's most significant bit is 1
// because serial numbers use ones' complement notation
// this RFC in section 4.1.2.2 requires serial numbers to be positive
// http://www.ietf.org/rfc/rfc5280.txt
function toPositiveHex(hexString: string) {
  let mostSignificativeHexAsInt = parseInt(hexString[0], 16)
  if (mostSignificativeHexAsInt < 8) {
    return hexString
  }

  mostSignificativeHexAsInt -= 8
  return mostSignificativeHexAsInt.toString() + hexString.substring(1)
}

export function createCertificate(): string {
  const days = 30
  const keySize = 2048

  const extensions = [
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
        {
          type: 7,
          ip: 'fe80::1'
        }
      ]
    }
  ]

  const attrs = [
    {
      name: 'commonName',
      value: 'example.org'
    },
    {
      name: 'countryName',
      value: 'US'
    },
    {
      shortName: 'ST',
      value: 'Virginia'
    },
    {
      name: 'localityName',
      value: 'Blacksburg'
    },
    {
      name: 'organizationName',
      value: 'Test'
    },
    {
      shortName: 'OU',
      value: 'Test'
    }
  ]

  const keyPair = forge.pki.rsa.generateKeyPair(keySize)

  const cert = forge.pki.createCertificate()

  cert.serialNumber = toPositiveHex(
    forge.util.bytesToHex(forge.random.getBytesSync(9))
  ) // the serial number can be decimal or hex (if preceded by 0x)

  cert.validity.notBefore = new Date()
  cert.validity.notAfter = new Date()
  cert.validity.notAfter.setDate(cert.validity.notBefore.getDate() + days)

  cert.setSubject(attrs)
  cert.setIssuer(attrs)

  cert.publicKey = keyPair.publicKey

  cert.setExtensions(extensions)

  const algorithm = forge.md.sha256.create()
  cert.sign(keyPair.privateKey, algorithm)

  const privateKeyPem = forge.pki.privateKeyToPem(keyPair.privateKey)
  const certPem = forge.pki.certificateToPem(cert)

  return privateKeyPem + certPem
}
