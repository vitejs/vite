// This creates a diamond dependency:
// main (this file)
//   -> chunk-a -> shared-base
//   -> chunk-b -> shared-base
//               -> chunk-a -> shared-base
//
// Expected CSS order: shared-base.css, chunk-a.css, chunk-b.css
// Expected final color: green (from chunk-b)
// Expected final background: yellow (from chunk-b)

Promise.all([import('./chunk-a.js'), import('./chunk-b.js')]).then(
  ([modA, modB]) => {
    modA.initChunkA()
    modB.initChunkB()
  },
)
