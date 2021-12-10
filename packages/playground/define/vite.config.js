module.exports = {
  define: {
    __EXP__: '1 + 1',
    __STRING__: '"hello"',
    __NUMBER__: JSON.stringify(123),
    __BOOLEAN__: JSON.stringify(true),
    __OBJ__: JSON.stringify({
      foo: 1,
      bar: {
        baz: 2
      },
      process: {
        env: {
          SOMEVAR: '"PROCESS MAY BE PROPERTY"'
        }
      }
    }),
    'process.env.SOMEVAR': '"SOMEVAR"'
  }
}
