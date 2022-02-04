const esbuild = require('esbuild')
const path = require('path')
async function main() {
  await esbuild.build({
    entryPoints: {
      input: path.resolve(__dirname, '../src/node/index.ts'),
      cli: path.resolve(__dirname, '../src/node/cli.ts')
    },
    platform: 'node',
    bundle: true,
    format: 'cjs',
    outdir: path.resolve(__dirname, '../dist/node'),
    plugins: [
      {
        name: 'external',
        setup(build) {
          build.onResolve({ filter: /.*/ }, (args) => {
            const externalList = ['rollup', 'esbuild', 'fsevents']
            if (externalList.includes(args.path)) {
              return {
                path: args.path,
                external: true
              }
            }
          })
        }
      }
    ]
  })
}

main()
