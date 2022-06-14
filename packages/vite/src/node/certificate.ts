import crypto from 'crypto'
import {
  SubjectAlternativeNameExtension,
  X509CertificateGenerator
} from '@peculiar/x509'

const NODE_MAJOR_VERSION = +process.versions.node.split('.')[0]

export async function createCertificate(): Promise<string> {
  const webcrypto =
    NODE_MAJOR_VERSION >= 16
      ? // Dirty hack to make tsc happy
        (crypto.webcrypto as unknown as Crypto)
      : // We can remove this dependency when we drop support for Node 14
        new (await import('@peculiar/webcrypto')).Crypto()

  const days = 30
  const notBefore = new Date()
  const notAfter = new Date()
  notAfter.setDate(notAfter.getDate() + days)

  const signingAlgorithm = {
    name: 'ECDSA',
    namedCurve: 'P-256',
    hash: 'SHA-256'
  }
  const { privateKey, publicKey } = await webcrypto.subtle.generateKey(
    signingAlgorithm,
    true,
    ['sign', 'verify']
  )
  const certificate = await X509CertificateGenerator.create(
    {
      serialNumber: '01',
      notBefore,
      notAfter,
      signingAlgorithm,
      publicKey,
      signingKey: privateKey,
      extensions: [
        new SubjectAlternativeNameExtension({
          dns: ['localhost', 'localhost.localdomain', 'lvh.me', '*.lvh.me'],
          ip: ['127.0.0.1', '::1']
        })
      ],
      subject: 'CN=localhost',
      issuer: 'CN=localhost'
    },
    webcrypto
  )

  // Or we can use `crypto.KeyObject.from(privateKey)` in Node >14
  const privateKeyInNodeCrypto = crypto.createPrivateKey({
    key: Buffer.from(await webcrypto.subtle.exportKey('pkcs8', privateKey)),
    format: 'der',
    type: 'pkcs8'
  })

  const privateKeyPEM = privateKeyInNodeCrypto.export({
    format: 'pem',
    type: 'pkcs8'
  })
  const certificatePEM = certificate.toString('pem')

  return privateKeyPEM + certificatePEM
}
