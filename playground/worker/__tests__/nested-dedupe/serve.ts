// This spec runs its own `vite build` directly and does not use the served
// playground page, so skip the default serve step. Without this file the
// harness would build the whole `playground/worker` root without any variant
// config, which cannot resolve the `@` alias used by unrelated fixtures.
export const serve = undefined
