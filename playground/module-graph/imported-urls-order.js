import { msg } from 'virtual:slow-module'
import './empty.js'

export default msg

// This module tests that the import order is preserved in this module's `importedUrls` property
// as the imports can be processed in parallel
