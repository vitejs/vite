import { rerender } from './runtime'

export const value = 'child'

if (import.meta.hot) {
  import.meta.hot.accept((newMod) => {
    if (!newMod) return

    rerender({ child: newMod.value })
  })

  import.meta.hot.dispose(() => {
    console.log('file-delete-restore/child.js is disposed')
  })

  import.meta.hot.prune(() => {
    console.log('file-delete-restore/child.js is pruned')
  })
}
