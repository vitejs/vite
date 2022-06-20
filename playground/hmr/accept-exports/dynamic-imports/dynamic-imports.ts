Promise.all([import('./deps-all-accepted'), import('./deps-some-accepted')])
  .then(([all, some]) => {
    console.log('loaded:all:' + all.a + all.b + all.c + all.default)
    console.log('loaded:some:' + some.a + some.b + some.c + some.default)
    console.log('>>> ready <<<')
  })
  .catch((err) => {
    console.error(err)
  })
