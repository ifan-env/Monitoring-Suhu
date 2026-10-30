import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [health, setHealth] = useState(null)

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then(setHealth)
      .catch((err) => setHealth({ status: 'error', message: err.message }))
  }, [])

  return (
    <main className="container">
      <h1>Monitory IoT</h1>
      <p>Backend status: {health ? health.status : 'checking...'}</p>
      {health?.message && <p className="error">{health.message}</p>}
    </main>
  )
}

export default App
