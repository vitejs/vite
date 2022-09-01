import { render } from 'react-dom'
import React from 'react'

import('./components/GreenButton').then(({ GreenButton }) => {
  render(<GreenButton />, document.querySelector('#green'))
})

import('./components/BlueButton').then(({ BlueButton }) => {
  render(<BlueButton />, document.querySelector('#blue'))
})
