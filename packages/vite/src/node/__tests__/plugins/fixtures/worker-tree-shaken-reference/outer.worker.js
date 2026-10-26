// The worker really uses lib.js, which starts a nested worker.
import { startHelper } from './lib.js'
startHelper()
