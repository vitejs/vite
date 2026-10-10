import { msg } from './Foo'

const el = document.querySelector('.extensionless-import-rename')!
el.textContent = msg

if (import.meta.hot) {
  import.meta.hot.accept('./Foo', ({ msg }) => {
    el.textContent = msg
  })
}
