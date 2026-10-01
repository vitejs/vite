import { rerender } from './runtime'

export const value = 'child'

if (import.meta.hot) {
  if (globalThis.__vite_file_delete_restore_child_pruned) {
    console.log(
      `file-delete-restore/child.js hot data after prune: ${import.meta.hot.data.persisted}`,
    )
    delete globalThis.__vite_file_delete_restore_child_pruned
  }
  import.meta.hot.data.persisted = true

  import.meta.hot.accept((newMod) => {
    if (!newMod) return

    rerender({ child: newMod.value })
  })

  import.meta.hot.dispose(() => {
    console.log('file-delete-restore/child.js is disposed')
  })

  import.meta.hot.prune(() => {
    console.log('file-delete-restore/child.js is pruned')
    globalThis.__vite_file_delete_restore_child_pruned = true
  })
}
