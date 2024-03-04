// This file is depended by main.css via this.addWatchFile
export const color = 'red'

// Self-accept so that updating this file would not trigger a page reload.
// We only want to observe main.css updating itself.
if (import.meta.hot) {
  import.meta.hot.accept()
}
