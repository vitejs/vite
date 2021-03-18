import React, { useEffect, useState } from 'react'

export default function DefaultImport() {
  const [isReady, setReady] = useState(false)

  useEffect(() => {
    if (!isReady) setReady(true)
  }, [isReady])

  return <React.Fragment />
}
