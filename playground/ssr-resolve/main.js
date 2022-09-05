// no `exports` key, should resolve to autosuggest-highlight/match/index.js
import match from 'autosuggest-highlight/match'
// no `exports` key, should resolve to lodash/isInteger.js
import isInteger from 'lodash/isInteger'
// has `exports` key, should resolve to react-dom/server
import { version } from 'react-dom/server'

export default `
  Matches: ${match('some text', 'te')}
  React: ${version}
  Lodash: ${isInteger(42)}
`
