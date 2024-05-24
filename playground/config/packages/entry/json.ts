/* eslint-disable @typescript-eslint/ban-ts-comment */
// Test if the JSON file is imported correctly
// Using `@ts-ignore` instead of `@ts-expect-error` due to environment-specific errors during `import`

let value: string

// Attempt to import with attributes
try {
  value = (
    await import('./package.json', {
      // @ts-ignore Import attributes are not supported in older Node versions
      with: { type: 'json' },
    })
  ).default.name
} catch {}

// Attempt to import with assertions
try {
  value = (
    await import('./package.json', {
      // @ts-ignore Import assertions are deprecated and not supported in Node v22.0.0 and above
      assert: { type: 'json' },
    })
  ).default.name
} catch {}

export const jsonValue = value
