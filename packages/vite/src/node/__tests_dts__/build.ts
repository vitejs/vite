import { build } from '../build'

const result = await build()

if (!('output' in result)) {
  throw new Error('Failed')
}

const first = result.output[0]

if (first.type === 'asset') {
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  first.source
} else {
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  first.code
}
