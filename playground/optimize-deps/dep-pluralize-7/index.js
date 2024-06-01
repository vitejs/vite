import pluralize from 'pluralize'

export function makePlural(value) {
  return pluralize(value, 2)
}
