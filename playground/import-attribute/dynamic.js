window.importAttribute = {
  json: () => import('./data.json', { with: { type: 'json' } }),
  assertion: () => import('./data.json', { assert: { type: 'json' } }),
  ordinary: () => import('./data.json'),
  // prettier-ignore
  template: () => import(`./data.json`, { with: { type: 'json' } }, /* trailing comma */),
  // prettier-ignore
  comments: () => import('./data.json' /* specifier */, /* options */ ({ with: { type: 'json' } })),
  async options() {
    const calls = []
    function options() {
      calls.push('options')
      return calls.push('value')
    }
    const data = await import('./data.json', {
      unused: options(),
      with: { type: 'json' },
    })
    return { value: data.default.foo, calls }
  },
  async nested() {
    return import('./data.json', {
      unused: await import('./data.json', { with: { type: 'json' } }),
      with: { type: 'json' },
    })
  },
  throwing() {
    try {
      return import(
        './data.json',
        (() => {
          throw new Error('options error')
        })()
      ).catch((error) => ({ synchronous: false, message: error.message }))
    } catch (error) {
      return { synchronous: true, message: error.message }
    }
  },
  async getter() {
    let calls = 0
    const data = await import('./data.json', {
      get with() {
        calls++
        return {}
      },
    })
    return { value: data.default.foo, calls }
  },
  async throwingGetter() {
    try {
      await import('./data.json', {
        get with() {
          throw new Error('getter error')
        },
      })
      return 'unexpected success'
    } catch (error) {
      return error.message
    }
  },
  async attributeGetter() {
    try {
      await import('./data.json', {
        with: {
          get type() {
            throw new Error('attribute getter error')
          },
        },
      })
      return 'unexpected success'
    } catch (error) {
      return error.message
    }
  },
  nativeData: () =>
    import('data:application/json,{"foo":"native"}', {
      with: { type: 'json' },
    }),
  nativeHttp: () =>
    import('https://example.com/data.json', { with: { type: 'json' } }),
}
