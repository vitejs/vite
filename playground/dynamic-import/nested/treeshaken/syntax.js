export const foo = () => {
  console.log('treeshaken syntax foo')
}
export const bar = {
  log: () => {
    console.log('treeshaken syntax bar')
  },
}
export default () => {
  console.log('treeshaken syntax default')
}
