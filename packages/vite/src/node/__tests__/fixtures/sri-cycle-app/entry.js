// Entry dynamically imports a, which dynamically imports b, which dynamically
// imports a — forming a runtime preload cycle once `manualChunks` forces a and
// b into separate chunks.
import('./a.js').then((a) => console.log(a.value))
