function dep() {
  const virtualId = '/node_modules/dep/index.js'

  return {
    name: 'dep',
    resolveId(id) {
      if (id === 'dep') {
        return virtualId
      }
    },
    load(id) {
      if (id === virtualId) {
        return 'export const DEP_STRING = `__STRING__`'
      }
    }
  }
}

module.exports = {
  define: {
    __EXP__: '1 + 1',
    __STRING__: '"hello"',
    __NUMBER__: 123,
    __BOOLEAN__: true,
    __OBJ__: {
      foo: 1,
      bar: {
        baz: 2
      },
      process: {
        env: {
          SOMEVAR: '"PROCESS MAY BE PROPERTY"'
        }
      }
    },
    'process.env.SOMEVAR': '"SOMEVAR"'
  },
  optimizeDeps: {
    exclude: ['dep']
  },
  plugins: [dep()]
}
