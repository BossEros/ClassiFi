import { useState } from 'react'
import Login from './components/Login'
import Register from './components/Register'

function App() {
  const [showRegister, setShowRegister] = useState(false)

  if (showRegister) {
    return <Register onBackToLogin={() => setShowRegister(false)} />
  }

  return <Login onRegisterClick={() => setShowRegister(true)} />
}

export default App
