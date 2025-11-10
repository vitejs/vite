export async function render(url) {
  switch (url) {
    case '/static-light':
      return (await import('./static-light')).render()
    case '/static-heavy':
      return (await import('./static-heavy')).render()
  }
}
