import fooJson from './foo.json'

// 'TRANSFORM_COUNT' is injected by the transform plugin
document.getElementById('transform-count').innerHTML = TRANSFORM_COUNT

document.getElementById('module-type-json-pre').innerHTML =
  fooJson.moduleTypePre
document.getElementById('module-type-json-post').innerHTML =
  fooJson.moduleTypePost
