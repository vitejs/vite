// This is used to setup a test scenario, where dep scanner
// could not determine all of the used dependencies on first
// pass, e.g., a dependency that is aliased using an absolute
// path, in which case it used to trigger unnecessary "full
// reloads" invalidating all modules in a module graph.
export { default } from '@vitejs/test-dep-alias-using-absolute-path'
