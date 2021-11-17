const virtualFile = '@virtual-file'
const virtualId = '\0' + virtualFile

const customVirtualFile = '@custom-virtual-file'

module.exports = {
  resolve: {
    extensions: ['.mjs', '.js', '.es', '.ts'],
    mainFields: ['custom', 'module'],
    conditions: ['custom']
  },
  plugins: [
    {
      name: 'virtual-module',
      resolveId(id) {
        if (id === virtualFile) {
          return virtualId
        }
      },
      load(id) {
        if (id === virtualId) {
          return `export const msg = "[success] from conventional virtual file"`
        }
      }
    },
    {
      name: 'custom-resolve',
      resolveId(id) {
        if (id === customVirtualFile) {
          return id
        }
      },
      load(id) {
        if (id === customVirtualFile) {
          return `export const msg = "[success] from custom virtual file"`
        }
      }
    }
  ]
}
