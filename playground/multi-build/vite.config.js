import path from 'path'
import fs from 'fs'

export default {
  configureBuild: buildMobile
}

function buildMobile(config, builds) {
  builds.push({
    id: 'index.mobile',
    get options() {
      // Reuse the options of main build.
      const { options } = builds[0]
      return {
        ...options,
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
          ...options.plugins
        ]
      }
    }
  })
}
