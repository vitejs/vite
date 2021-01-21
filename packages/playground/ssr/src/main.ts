export function createVueApp() {
  return import('./vue/index').then(({ createVueApp }) => createVueApp())
}

export function createReactApp() {
  return import('./react/index').then(({ createReactApp }) => createReactApp())
}
