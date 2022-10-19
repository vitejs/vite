import { createContext, useState } from 'react'
export const CountContext = createContext()

export const CountProvider = ({ children }) => {
  const [count, setCount] = useState(0)
  return (
    <CountContext.Provider value={{ count, setCount }}>
      {children}
      <div id="context-provider">context provider</div>
    </CountContext.Provider>
  )
}
