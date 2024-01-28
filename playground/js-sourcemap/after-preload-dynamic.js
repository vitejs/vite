console.log(`
false-positive sourcemap comments
//# sourceMappingURL=1.css.map
/*# sourceMappingURL=2.css.map */
`)

import('./dynamic/dynamic-foo')

console.log('after preload dynamic')
