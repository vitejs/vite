// regression test for https://github.com/vitejs/vite/issues/22301
// `order-static-base.css` is imported first, then `order-static-dep.js`
// (force-split into its own chunk because it's a separate build input).
// The CSS bundle must list `order-static-base.css` before
// `order-static-dep.css` so the rule from the dep — semantically the
// later import — overrides the base.
import './order-static-base.css'
import './order-static-dep.js'

document.querySelector('.order-static')
