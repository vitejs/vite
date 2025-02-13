// test complicated stack since broken sourcemap
// might still look correct with a simple case
function main() {
  mainInner()
}

function mainInner() {
  // @ts-expect-error "define"
  console.trace('with-define-object', __testDefineObject)
}

main()
