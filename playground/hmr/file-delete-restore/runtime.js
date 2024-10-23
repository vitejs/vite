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
  document.querySelector('.file-delete-restore').textContent =
    Object.values(state).join(':')
}
