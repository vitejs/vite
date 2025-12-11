const ENV = {
  modulePrefix: 'vite-ember-ts-starter',
  environment: import.meta.env.DEV ? 'development' : 'production',
  rootURL: '/',
  locationType: 'history',
  APP: {
    // Here you can pass flags/options to your application instance
    // when it is created
  } as any,
}

export default ENV
