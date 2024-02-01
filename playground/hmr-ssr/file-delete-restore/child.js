import { rerender } from './runtime'

export const value = 'child'

if (import.meta.hot) {
  import.meta.hot.accept((newMod) => {
    if (!newMod) return

    rerender({ child: newMod.value })
  })
}
