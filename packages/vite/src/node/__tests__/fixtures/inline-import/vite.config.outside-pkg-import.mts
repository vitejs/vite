// @ts-expect-error not typed
import parent from 'parent'

export default {
  __injected: parent.child,
}
