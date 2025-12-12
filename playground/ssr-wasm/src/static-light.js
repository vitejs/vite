import light from './light.wasm?init'

export async function render() {
  let result
  const { exported_func } = await light({
    imports: {
      imported_func: (res) => (result = res),
    },
  }).then((i) => i.exports)
  exported_func()
  return `<div class="static-light">${result}</div>`
}
