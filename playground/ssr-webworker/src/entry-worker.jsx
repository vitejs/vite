import { equal } from 'node:assert'
import { msg as linkedMsg } from '@vitejs/test-resolve-linked'
import browserExportsMessage from '@vitejs/test-browser-exports'
import workerExportsMessage from '@vitejs/test-worker-exports'
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
    <p class="browser-exports">${browserExportsMessage}</p>
    <p class="worker-exports">${workerExportsMessage}</p>
    <p class="nodejs-compat">${equal('a', 'a') || '[success] nodejs compat'}</p>
    `,
      {
        headers: {
          'content-type': 'text/html',
        },
      },
    ),
  )
})
