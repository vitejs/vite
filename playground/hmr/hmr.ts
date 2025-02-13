import { virtual } from 'virtual:file'
import { virtual as virtualDep } from 'virtual:file-dep'
import { foo as depFoo, nestedFoo } from './hmrDep'
import './importing-updated'
import './file-delete-restore'
import './optional-chaining/parent'
import './intermediate-file-delete'
import './circular'
import logo from './logo.svg'
import logoNoInline from './logo-no-inline.svg'
import { msg as softInvalidationMsg } from './soft-invalidation'

export const foo = 1
text('.app', foo)
text('.dep', depFoo)
text('.nested', nestedFoo)
text('.virtual', virtual)
text('.virtual-dep', virtualDep)
text('.soft-invalidation', softInvalidationMsg)
setImgSrc('#logo', logo)
setImgSrc('#logo-no-inline', logoNoInline)

text('.virtual-dep', 0)

const btn = document.querySelector('.virtual-update') as HTMLButtonElement
btn.onclick = () => {
  if (import.meta.hot) {
    import.meta.hot.send('virtual:increment')
  }
}

const btnDep = document.querySelector(
  '.virtual-update-dep',
) as HTMLButtonElement
btnDep.onclick = () => {
  if (import.meta.hot) {
    import.meta.hot.send('virtual:increment', '-dep')
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
    setImgSrc('#logo', newUrl.default)
    console.log('Logo updated', newUrl.default)
  })

  import.meta.hot.accept('./logo-no-inline.svg', (newUrl) => {
    setImgSrc('#logo-no-inline', newUrl.default)
    console.log('Logo-no-inline updated', newUrl.default)
  })

  import.meta.hot.accept('./hmrDep', ({ foo, nestedFoo }) => {
    handleDep('single dep', foo, nestedFoo)
  })

  import.meta.hot.accept('virtual:file-dep', ({ virtual }) => {
    text('.virtual-dep', virtual)
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
        update.type === 'css-update' && update.path.includes('global.css'),
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

function setImgSrc(el, src) {
  ;(document.querySelector(el) as HTMLImageElement).src = src
}

function removeCb({ msg }) {
  text('.toRemove', msg)
  import.meta.hot.off('custom:remove', removeCb)
}
