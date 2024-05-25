/* eslint-disable @typescript-eslint/ban-ts-comment */
// Test if the JSON file is imported correctly

let value: string

const [major, minor] = process.versions.node.split('.').map(Number)

// Attempt to use import attributes
try {
  // Prevent tsc from reading the file by using `.replace(...)`
  value = (await import('json-via-import-attributes.js'.replace(/^/, './')))
    .default
} catch (e) {
  // Import attributes are supported in Node.js v18.20+, v20.10+, and v22.0+
  // Throw an error if not working on these versions
  if (
    major >= 22 ||
    (major === 20 && minor >= 10) ||
    (major === 18 && minor >= 20)
  ) {
    console.error(
      'Import attributes should be supported in Node.js version',
      process.versions.node,
    )
    throw e
  }
}

// Attempt to use import assertions
try {
  // Prevent tsc from reading the file by using `.replace(...)`
  value = (await import('json-via-import-assertions.js'.replace(/^/, './')))
    .default
} catch {}

export const jsonValue = value
