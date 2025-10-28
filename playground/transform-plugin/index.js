import barJson from 'virtual:/bar.json'
import fooJson from './foo.json'

// 'TRANSFORM_COUNT' is injected by the transform plugin
document.getElementById('transform-count').innerHTML = TRANSFORM_COUNT

document.getElementById('module-type-json-pre').innerHTML =
  fooJson.moduleTypePre
document.getElementById('module-type-json-post').innerHTML =
  fooJson.moduleTypePost

document.getElementById('module-type-json-virtual-pre').innerHTML =
  barJson.moduleTypePre
document.getElementById('module-type-json-virtual-post').innerHTML =
  barJson.moduleTypePost
