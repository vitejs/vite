import { childValue, parentValue } from './parent'
import { render } from './runtime'

render({ parent: parentValue, child: childValue })
