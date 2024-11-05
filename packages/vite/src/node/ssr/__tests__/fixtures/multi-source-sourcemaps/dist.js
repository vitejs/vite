// nested-directory/nested-file.js
var nested_file_default =
  'Nested file will trigger edge case that used to break sourcemaps'

// entrypoint.js
function entrypoint() {
  console.log(nested_file_default)
  throw new Error('Hello world')
}
export { entrypoint }
//# sourceMappingURL=dist.js.map
