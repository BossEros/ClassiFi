/**
 * Main Application Component
 * Part of the Presentation Layer
 */

import { useState } from 'react'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'

function App() {
  const [showRegister, setShowRegister] = useState(false)

  const handleLoginSuccess = () => {
    // TODO: Navigate to home/dashboard when routing is implemented
    console.log('Login successful! Redirecting to home...')
  }

  const handleRegisterSuccess = () => {
    // TODO: Navigate to home/dashboard when routing is implemented
    console.log('Registration successful! Redirecting to home...')
  }

  if (showRegister) {
    return (
      <RegisterPage
        onBackToLogin={() => setShowRegister(false)}
        onRegisterSuccess={handleRegisterSuccess}
      />
    )
  }

  return (
    <LoginPage
      onRegisterClick={() => setShowRegister(true)}
      onLoginSuccess={handleLoginSuccess}
    />
  )
}

export default App
