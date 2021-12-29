export const externalThrow = () => {
  throw new Error('Throw from externalThrow')
}

export const externalAsync = async () => {
  throw new Error('Rejection from externalAsync')
}
