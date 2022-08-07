import './d-red.css' // confuse the compiler
import { baseRedText } from './d-base-red-text'
import styles from './d-fuchsia.module.css'

baseRedText(
  `${styles['d-fuchsia']} async-modules-and-css-fuchsia`,
  '[depth] (fuchsia)'
)
