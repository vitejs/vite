import { virtual } from 'virtual:file'
import { foo as depFoo, nestedFoo } from './hmrDep'
import './importing-updated'
import './invalidation/parent'
import './file-delete-restore'
import './optional-chaining/parent'
import './intermediate-file-delete'
import './circular'
import './queries'
import logo from './logo.svg'
import logoNoInline from './logo-no-inline.svg'
import { msg as softInvalidationMsg } from './soft-invalidation'

export const foo = 1
text('.app', foo)
text('.dep', depFoo)
text('.nested', nestedFoo)
text('.virtual', virtual)
text('.soft-invalidation', softInvalidationMsg)
setImgSrc('#logo', logo)
setImgSrc('#logo-no-inline', logoNoInline)

globalThis.__HMR__['virtual:increment'] = () => {
  if (import.meta.hot) {
    import.meta.hot.send('virtual:increment')
  }
}

if (import.meta.hot) {
  import.meta.hot.accept(({ foo }) => {
    log('(self-accepting 1) foo is now:', foo)
  })

  import.meta.hot.accept(({ foo }) => {
    log('(self-accepting 2) foo is now:', foo)
  })

  const handleDep = (type, newFoo, newNestedFoo) => {
    log(`(${type}) foo is now: ${newFoo}`)
    log(`(${type}) nested foo is now: ${newNestedFoo}`)
    text('.dep', newFoo)
    text('.nested', newNestedFoo)
  }

  import.meta.hot.accept('./logo.svg', (newUrl) => {
    setImgSrc('#logo', newUrl.default)
    log('Logo updated', newUrl.default)
  })

  import.meta.hot.accept('./logo-no-inline.svg', (newUrl) => {
    setImgSrc('#logo-no-inline', newUrl.default)
    log('Logo-no-inline updated', newUrl.default)
  })

  import.meta.hot.accept('./hmrDep', ({ foo, nestedFoo }) => {
    handleDep('single dep', foo, nestedFoo)
  })

  import.meta.hot.accept(['./hmrDep'], ([{ foo, nestedFoo }]) => {
    handleDep('multi deps', foo, nestedFoo)
  })

  import.meta.hot.dispose(() => {
    log(`foo was:`, foo)
  })

  import.meta.hot.on('vite:afterUpdate', (event) => {
    log(`>>> vite:afterUpdate -- ${event.type}`)
  })

  import.meta.hot.on('vite:beforeUpdate', (event) => {
    log(`>>> vite:beforeUpdate -- ${event.type}`)

    const cssUpdate = event.updates.find(
      (update) =>
        update.type === 'css-update' && update.path.includes('global.css'),
    )
    if (cssUpdate) {
      log('CSS updates are not supported in SSR')
    }
  })

  import.meta.hot.on('vite:error', (event) => {
    log(`>>> vite:error -- ${event.err.message}`)
  })

  import.meta.hot.on('vite:invalidate', ({ path }) => {
    log(`>>> vite:invalidate -- ${path}`)
  })

  import.meta.hot.on('custom:foo', ({ msg }) => {
    text('.custom', msg)
  })

  import.meta.hot.on('custom:remove', removeCb)

  // send custom event to server to calculate 1 + 2
  import.meta.hot.send('custom:remote-add', { a: 1, b: 2 })
  import.meta.hot.on('custom:remote-add-result', ({ result }) => {
    text('.custom-communication', result)
  })
}

function text(el, text) {
  hmr(el, text)
}

function setImgSrc(el, src) {
  hmr(el, src)
}

function removeCb({ msg }) {
  text('.toRemove', msg)
  import.meta.hot.off('custom:remove', removeCb)
}

function hmr(key: string, value: unknown) {
  ;(globalThis.__HMR__ as any)[key] = String(value)
}
