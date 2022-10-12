import { resolve } from 'node:path'
import { loadConfigFromFile } from 'vite'
import { expect, it } from 'vitest'

it('loadConfigFromFile', async () => {
  const { config } = await loadConfigFromFile(
    {} as any,
    resolve(__dirname, '../packages/entry/vite.config.ts')
  )
  expect(config).toMatchInlineSnapshot(`
    {
      "array": [
        [
          1,
          3,
        ],
        [
          2,
          4,
        ],
      ],
    }
  `)
})

// it('loadConfigFromFile with rollupconfig', async () => {
//   const { config } = await loadConfigFromFile(
//     {} as any,
//     resolve(__dirname, '../packages/entry/vite.config.ts')
//   )
//   expect(config).toMatchInlineSnapshot(`
//     {
//       "array": [
//         [
//           1,
//           3,
//         ],
//         [
//           2,
//           4,
//         ],
//       ],
//       "build" : {
//         "plugins": [],
//         "input": 'src/index.ts',
//         "output": {
//           dir: 'dist',
//           format: 'cjs',
//         },
//       }
//     }
//   `)
// })
