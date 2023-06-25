import { component$, useSignal } from '@builder.io/qwik'
import type { DocumentHead } from '@builder.io/qwik-city'

import qwiklogo from '~/assets/qwik.svg'
import viteLogo from '~/assets/vite.svg'

export default component$(() => {
  const count = useSignal(0)

  return (
    <>
      <div id="root">
        <div>
          <a href="https://vitejs.dev" target="_blank">
            <img src={viteLogo} class="logo" alt="Vite logo" />
          </a>
          <a href="https://qwik.builder.io/" target="_blank">
            <img src={qwiklogo} class="logo qwik" alt="Qwik logo" />
          </a>
        </div>
        <h1>Vite + Qwik</h1>
        <div class="card">
          <button onClick$={() => (count.value += 1)}>
            count is {count.value}
          </button>
          <p>
            Edit <code>src/routes/index.tsx</code> and save to test HMR
          </p>
        </div>
        <p class="read-the-docs">
          Click on the Vite and Qwik logos to learn more
        </p>
      </div>
    </>
  )
})

export const head: DocumentHead = {
  title: 'Vite + Qwik + TS',
  meta: [
    {
      name: 'description',
      content: 'Qwik site description',
    },
  ],
}
