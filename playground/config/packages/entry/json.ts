// test if the json file is imported correctly

let value: string

// try import attributes
try {
  value = (
    await import('./package.json', {
      with: { type: 'json' },
    })
  ).default.name
} catch {}

// try import assertions
try {
  value = (
    await import('./package.json', {
      assert: { type: 'json' },
    })
  ).default.name
} catch {}

export const jsonValue = value
