// how many times this body ran in the page; the specs read it back
globalThis.__sharedRuns = (globalThis.__sharedRuns ?? 0) + 1

export const shared = 'shared-value'
