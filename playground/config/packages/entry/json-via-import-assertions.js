// Ensure that the import assertions work as expected
// Not using .ts as the compiler may not be able to parse the import statement with import assertions

import pkg from './package.json' assert { type: 'json' }

export default pkg.name
