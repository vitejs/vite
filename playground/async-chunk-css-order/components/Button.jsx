import React from 'react'
import './Button.css'

export function Button({ children, className }) {
  return (
    <button className={`btn ${className}`} type="button">
      {children}
    </button>
  )
}
