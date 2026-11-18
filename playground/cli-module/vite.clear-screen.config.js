export default {
  clearScreen: true,
  plugins: [
    {
      name: 'report-clear-screen',
      configResolved(config) {
        console.log(`resolved clearScreen: ${config.clearScreen}`)
      },
    },
  ],
}
