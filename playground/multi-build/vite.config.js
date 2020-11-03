const path = require('path')
const fs = require('fs')

module.exports = {
  configureBuild: buildMobile
}

/**
 * With this build hook, Vite will generate a bundle for mobile devices
 * by swapping out modules that have a `[name].mobile.[ext]` variant.
 */
function buildMobile(ctx) {
  // Reuse the main build's options.
  ctx.beforeEach((options, i) => {
    if (i > 0) return
    ctx.build({
      ...options,
      input: 'index.html',
      output: {
        file: 'index.mobile.html'
      },
      plugins: [
        {
          name: 'resolveMobile',
          resolveId: resolveMobile
        },
        ...options.plugins
      ]
    })
  })
}

async function resolveMobile(id, parent) {
  if (id[0] === '.') {
    const resolved = await this.resolve(id, parent, {
      skipSelf: true
    })
    const ext = path.extname(resolved.id)
    const mobileId = resolved.id.slice(0, -ext.length) + '.mobile' + ext

    // Use .mobile version if it exists
    if (fs.existsSync(mobileId)) {
      return mobileId
    }
  }
}
