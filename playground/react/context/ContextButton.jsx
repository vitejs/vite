import { useContext } from 'react'
import { CountContext } from './CountProvider'

export function ContextButton() {
  const { count, setCount } = useContext(CountContext)
  return (
    <button id="context-button" onClick={() => setCount((count) => count + 1)}>
      context-based count is: {count}
    </button>
  )
}
