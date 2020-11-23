const path = require('path')

module.exports = {
  preset: 'ts-jest',
  globals: {
    'ts-jest': {
      tsconfig: path.resolve(__dirname, 'test/tsconfig.json')
    }
  },
  testPathIgnorePatterns: ['/playground/', '/node_modules/'],
  watchPathIgnorePatterns: ['<rootDir>/temp']
}
