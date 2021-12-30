export const externalThrow = () => {
  throw new Error('Throw from externalThrow')
}

export const externalAsync = async () => {
  return Promise.reject('Reject from externalAsync')
}
