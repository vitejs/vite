declare let __defineObject: object

function main() {
  // this will be replaced with `define_defineObject_default` object
  // devtool should show "repro.ts:6"
  console.log('[__defineObject]', __defineObject)
}

main()
