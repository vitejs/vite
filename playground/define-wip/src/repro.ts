function main() {
  // this will be replaced with `define_import_meta_env_default` object
  console.log('[import.meta.env]', import.meta.env) // devtool should show "repro.ts:3"
}

main()
