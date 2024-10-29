import { rerender } from './runtime'

export const parentValue = 'parent'
export { value as childValue } from './child'

if (import.meta.hot) {
  import.meta.hot.accept((newMod) => {
    if (!newMod) return

    rerender({ child: newMod.childValue, parent: newMod.parentValue })
  })
}
