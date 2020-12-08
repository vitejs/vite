// https://github.com/rollup/rollup/blob/master/src/watch/fsevents-importer.ts
// MIT Licensed https://github.com/rollup/rollup/blob/master/LICENSE.md
// Conditionally load fs-events so that we can bundle chokidar.

let fsEvents: any
let fsEventsImportError: any

export function loadFsEvents() {
  return import('fsevents')
    .then((namespace) => {
      fsEvents = namespace.default
    })
    .catch((err) => {
      fsEventsImportError = err
    })
}

// A call to this function will be injected into the chokidar code
export function getFsEvents() {
  if (fsEventsImportError) throw fsEventsImportError
  return fsEvents
}
