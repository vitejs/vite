import { createVueApp, createReactApp } from './main'

if (location.pathname.startsWith('/vue')) {
  createVueApp().then((app) => app.mount('#app'))
} else if (location.pathname.startsWith('/react')) {
  Promise.all([import('react-dom'), createReactApp()]).then(
    ([ReactDOM, app]) => {
      ReactDOM.hydrate(app, document.getElementById('app'))
    }
  )
}
