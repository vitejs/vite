export const foo = () => {
  console.log('treeshaken foo')
}
export const bar = () => {
  console.log('treeshaken bar')
}
export const baz1 = () => {
  console.log('treeshaken baz1')
}
export const baz2 = {
  log: () => {
    console.log('treeshaken baz2')
  },
}
export const baz3 = {
  log: () => {
    console.log('treeshaken baz3')
  },
}
export const baz4 = () => {
  console.log('treeshaken baz4')
}
export const baz5 = () => {
  console.log('treeshaken baz5')
}
export const baz6 = () => {
  console.log('treeshaken baz6')
}
export const removed = () => {
  console.log('treeshaken removed')
}
export default () => {
  console.log('treeshaken default')
}
