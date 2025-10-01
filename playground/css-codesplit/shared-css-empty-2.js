export default function shouldBeTreeshaken_2() {
  // This function should be treeshaken, even if { moduleSideEffects: 'no-treeshake' }
  // was used in the JS corresponding to the HTML entrypoint.
}
