import React from 'react'
import ReactDomClient from 'react-dom/client'
import Root from './root'

async function main() {
  const el = document.getElementById('root')
  React.startTransition(() => {
    ReactDomClient.hydrateRoot(el!, <Root />)
  })
}

main()
