module.exports = async () => {
  await global.__BROWSER_SERVER__.close()
}
