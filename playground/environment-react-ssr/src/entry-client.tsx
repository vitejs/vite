import ReactDomClient from 'react-dom/client'
import Root from './root'
import React from 'react'

async function main() {
  const el = document.getElementById('root')
  React.startTransition(() => {
    ReactDomClient.hydrateRoot(el!, <Root />)
  })
}

main()
