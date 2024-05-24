/* eslint-disable @typescript-eslint/ban-ts-comment */
// whether or not an error occurs on `import depends on the environment, so only `@ts-ignore` can be used

// test if the json file is imported correctly

let value: string

// try import attributes
try {
  value = (
    await import('./package.json', {
      // @ts-ignore import attributes are not supported on older Node versions
      with: { type: 'json' },
    })
  ).default.name
} catch {}

// try import assertions
try {
  value = (
    await import('./package.json', {
      // @ts-ignore import assertions are not supported on Node v22.0.0 and above
      assert: { type: 'json' },
    })
  ).default.name
} catch {}

export const jsonValue = value
