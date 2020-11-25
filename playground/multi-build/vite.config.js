import path from 'path'
import fs from 'fs'

export default {
  configureBuild: buildMobile
}

function buildMobile(config, builds) {
  return once(() => {
    // Reuse the options of main build.
    const mainBuild = builds[0]
    builds.push({
      ...mainBuild,
      input: 'index.html',
      output: {
        file: 'index.mobile.html'
      },
      plugins: [
        {
          name: 'resolveMobile',
          async resolveId(id, parent) {
            if (id[0] === '.') {
              const resolved = await this.resolve(id, parent, {
                skipSelf: true
              })
              const ext = path.extname(resolved.id)
              const mobileId =
                resolved.id.slice(0, -ext.length) + '.mobile' + ext

              // Use .mobile version if it exists
              if (fs.existsSync(mobileId)) {
                return mobileId
              }
            }
          }
        },
        ...mainBuild.plugins
      ]
    })
  })
}

function once(fn) {
  let called = false
  return () => (!called && fn(), (called = true))
}
