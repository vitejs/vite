function shouldBeTreeshaken_1() {
  // This function should be treeshaken, even if { moduleSideEffects: 'no-treeshake' }
  // was used in the JS corresponding to the HTML entrypoint.
}
