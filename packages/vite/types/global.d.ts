// https://stackoverflow.com/a/59499895/6897682
export {}

// https://github.com/facebook/jest/issues/11640#issuecomment-893867514
declare global {
  namespace NodeJS {
    interface Global {}
  }
}
