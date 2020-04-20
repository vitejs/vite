const fs = require('fs')
const path = require('path')
const chokidar = require('chokidar')
const { parseSFC } = require('./parseSFC')

exports.createFileWatcher = (notify) => {
  const fileWatcher = chokidar.watch(process.cwd(), {
    ignored: [/node_modules/]
  })

  fileWatcher.on('change', (file) => {
    if (file.endsWith('.vue')) {
      // check which part of the file changed
      const [descriptor, prevDescriptor] = parseSFC(file)
      const resourcePath = '/' + path.relative(process.cwd(), file)

      if (!prevDescriptor) {
        // the file has never been accessed yet
        return
      }

      if (
        (descriptor.script && descriptor.script.content) !==
        (prevDescriptor.script && prevDescriptor.script.content)
      ) {
        console.log(`[hmr] <script> for ${resourcePath} changed. Triggering component reload.`)
        notify({
          type: 'reload',
          path: resourcePath
        })
        return
      }

      if (
        (descriptor.template && descriptor.template.content) !==
        (prevDescriptor.template && prevDescriptor.template.content)
      ) {
        console.log(`[hmr] <template> for ${resourcePath} changed. Triggering component re-render.`)
        notify({
          type: 'rerender',
          path: resourcePath
        })
        return
      }

      // TODO styles
    } else {
      console.log(`[hmr] script file ${resourcePath} changed. Triggering full page reload.`)
      notify({
        type: 'full-reload'
      })
    }
  })
}
