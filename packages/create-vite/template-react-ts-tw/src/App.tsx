import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import tailwindLogo from '/tailwind.svg'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="flex justify-between">
        <a href="https://vite.dev" target="_blank">
          <img
            src={viteLogo}
            className="h-24 p-6 hover:drop-shadow-[0_0_2em_#646cffaa] transition-all"
            alt="Vite logo"
          />
        </a>
        <a href="https://react.dev" target="_blank">
          <img
            src={reactLogo}
            className="h-24 p-6 hover:drop-shadow-[0_0_2em_#61dafbaa] transition-all motion-safe:animate-[spin_20s_linear_infinite]"
            alt="React logo"
          />
        </a>
        <a href="https://tailwindcss.com/" target="_blank">
          <img
            src={tailwindLogo}
            className="h-24 p-6 hover:drop-shadow-[0_0_2em_#61dafbaa] transition-all"
            alt="React logo"
          />
        </a>
      </div>
      <h1>Vite + React + Tailwind</h1>
      <div className="p-8">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p className="pt-2">
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="text-gray-500">
        Click on the Vite, React and Tailwindcss logos to learn more
      </p>
    </>
  )
}

export default App
