import { msg as linkedMsg } from 'resolve-linked'
import React from 'react'

let loaded = false
import('./dynamic').then(({ foo }) => {
  loaded = !!foo
})

addEventListener('fetch', function (event) {
  return event.respondWith(
    new Response(
      `
    <h1>hello from webworker</h1>
    <p class="linked">${linkedMsg}</p>
    <p class="external">${typeof React}</p>
    <p>dynamic: ${loaded}</p>
    `,
      {
        headers: {
          'content-type': 'text/html',
        },
      },
    ),
  )
})
