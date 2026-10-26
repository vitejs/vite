// Only createWorker is used; useHelper (and with it lib.js's nested worker) is tree-shaken from the main bundle.
import { createWorker } from './index.js'
createWorker()
