import assetUrl from '../nested/asset.png'
import inlineCss from './typeof-inline.css?inline'

function text(el, text) {
  document.querySelector(el).textContent = text
}
text('.relative-js', 'hello')

// An asset URL placeholder must keep its meaning when it ends up as the operand
// of a unary operator. The `=== 'string'` comparison is what makes the bundler
// inline the placeholder into the `typeof` operand. See #22304.
text('.typeof-asset-url', typeof assetUrl === 'string' ? 'string' : 'broken')
text('.typeof-inline-css', typeof inlineCss === 'string' ? 'string' : 'broken')
