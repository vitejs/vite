export async function render(url) {
  switch (url) {
    case '/':
      return `<ul>${['/static-light', '/static-heavy']
        .map((name) => `<li><a href="${name}">${name}</a></li>`)
        .join('')}</ul>`
    case '/static-light':
      return (await import('./static-light')).render()
    case '/static-heavy':
      return (await import('./static-heavy')).render()
  }
}
