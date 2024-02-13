import { test } from './dep.js'

function main() {
  test()
}

main()

import.meta.hot.accept('./dep.js')
