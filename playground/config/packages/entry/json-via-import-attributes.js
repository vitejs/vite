// Ensure that the import attributes work as expected
// Not using .ts as the compiler may not be able to parse the import statement with import attributes

import pkg from './package.json' with { type: 'json' }

export default pkg.name
