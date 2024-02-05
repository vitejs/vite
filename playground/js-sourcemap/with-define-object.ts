declare let __testDefineObject: unknown

// test complicated stack since broken sourcemap
// might still look correct with a simple case
function f1() {
  f2()
}

function f2() {
  console.trace('with-define-object', __testDefineObject)
}

f1()
