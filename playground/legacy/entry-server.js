// This counts as 'server-side' rendering, yes?
export async function render() {
  return /* html */ `
    <div id="app">Hello</div>
    <div id="env">${import.meta.env.LEGACY}</div>
  `
}
