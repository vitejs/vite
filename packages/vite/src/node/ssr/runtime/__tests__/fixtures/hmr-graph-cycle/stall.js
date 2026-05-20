// Holds t mid-eval so that a concurrent consumer can race in through
// cachedRequest after mod.exports has been assigned. The wait hook is
// installed by the test before the race begins.
export default await globalThis.__vite_ssr_hmr_graph_cycle__?.wait?.()
