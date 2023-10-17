import { virtual } from 'virtual:file'
import { foo as depFoo, nestedFoo } from './hmrDep'
import './importing-updated'
import './invalidation/parent'
import './file-delete-restore'
import './optional-chaining/parent'
import logo from './logo.svg'

export const foo = 1
text('.app', foo)
text('.dep', depFoo)
text('.nested', nestedFoo)
text('.virtual', virtual)
setLogo(logo)

const btn = document.querySelector('.virtual-update') as HTMLButtonElement
btn.onclick = () => {
  if (import.meta.hot) {
    import.meta.hot.send('virtual:increment')
  }
}

if (import.meta.hot) {
  import.meta.hot.accept(({ foo }) => {
    console.log('(self-accepting 1) foo is now:', foo)
  })

  import.meta.hot.accept(({ foo }) => {
    console.log('(self-accepting 2) foo is now:', foo)
  })

  const handleDep = (type, newFoo, newNestedFoo) => {
    console.log(`(${type}) foo is now: ${newFoo}`)
    console.log(`(${type}) nested foo is now: ${newNestedFoo}`)
    text('.dep', newFoo)
    text('.nested', newNestedFoo)
  }

  import.meta.hot.accept('./logo.svg', (newUrl) => {
    setLogo(newUrl.default)
    console.log('Logo updated', newUrl.default)
  })

  import.meta.hot.accept('./hmrDep', ({ foo, nestedFoo }) => {
    handleDep('single dep', foo, nestedFoo)
  })

  import.meta.hot.accept(['./hmrDep'], ([{ foo, nestedFoo }]) => {
    handleDep('multi deps', foo, nestedFoo)
  })

  import.meta.hot.dispose(() => {
    console.log(`foo was:`, foo)
  })

  import.meta.hot.on('vite:afterUpdate', (event) => {
    console.log(`>>> vite:afterUpdate -- ${event.type}`)
  })

  import.meta.hot.on('vite:beforeUpdate', (event) => {
    console.log(`>>> vite:beforeUpdate -- ${event.type}`)

    const cssUpdate = event.updates.find(
      (update) =>
        update.type === 'css-update' && update.path.match('global.css'),
    )
    if (cssUpdate) {
      text(
        '.css-prev',
        (document.querySelector('.global-css') as HTMLLinkElement).href,
      )

      // Wait until the tag has been swapped out, which includes the time taken
      // to download and parse the new stylesheet. Assert the swapped link.
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (
              node.nodeType === Node.ELEMENT_NODE &&
              (node as Element).tagName === 'LINK'
            ) {
              text('.link-tag-added', 'yes')
            }
          })
          mutation.removedNodes.forEach((node) => {
            if (
              node.nodeType === Node.ELEMENT_NODE &&
              (node as Element).tagName === 'LINK'
            ) {
              text('.link-tag-removed', 'yes')
              text(
                '.css-post',
                (document.querySelector('.global-css') as HTMLLinkElement).href,
              )
            }
          })
        })
      })

      observer.observe(document.querySelector('#style-tags-wrapper'), {
        childList: true,
      })
    }
  })

  import.meta.hot.on('vite:error', (event) => {
    console.log(`>>> vite:error -- ${event.err.message}`)
  })

  import.meta.hot.on('vite:invalidate', ({ path }) => {
    console.log(`>>> vite:invalidate -- ${path}`)
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
  document.querySelector(el).textContent = text
}

function setLogo(src) {
  ;(document.querySelector('#logo') as HTMLImageElement).src = src
}

function removeCb({ msg }) {
  text('.toRemove', msg)
  import.meta.hot.off('custom:remove', removeCb)
}
