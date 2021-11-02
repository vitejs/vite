const virtualFile = '@virtual-file'

module.exports = {
  resolve: {
    extensions: ['.mjs', '.js', '.es', '.ts'],
    mainFields: ['custom', 'module'],
    conditions: ['custom']
  },
  plugins: [
    {
      name: 'custom-resolve',
      resolveId(id) {
        if (id === virtualFile) {
          return id
        }
      },
      load(id) {
        if (id === virtualFile) {
          return `export const msg = "[success] from virtual file"`
        }
      }
    }
  ]
}
