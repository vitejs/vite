let state = {}

export const render = (newState) => {
  state = newState
  apply()
}

export const rerender = (updates) => {
  state = { ...state, ...updates }
  apply()
}

const apply = () => {
  globalThis.__HMR__['.file-delete-restore'] = Object.values(state).join(':')
}
