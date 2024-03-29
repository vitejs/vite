import ReactDomClient from 'react-dom/client'
import React from 'react'
import Root from './root'

async function main() {
  const el = document.getElementById('root')
  React.startTransition(() => {
    ReactDomClient.hydrateRoot(el!, <Root />)
  })
}

main()
