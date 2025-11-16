/**
 * Main Application Component
 * Part of the Presentation Layer
 */

import { useState } from 'react'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'

type PageView = 'login' | 'register' | 'forgot-password'

function App() {
  const [currentPage, setCurrentPage] = useState<PageView>('login')

  const handleLoginSuccess = () => {
    // TODO: Navigate to home/dashboard when routing is implemented
    console.log('Login successful! Redirecting to home...')
  }

  const handleRegisterSuccess = () => {
    // TODO: Navigate to home/dashboard when routing is implemented
    console.log('Registration successful! Redirecting to home...')
  }

  if (currentPage === 'register') {
    return (
      <RegisterPage
        onBackToLogin={() => setCurrentPage('login')}
        onRegisterSuccess={handleRegisterSuccess}
      />
    )
  }

  if (currentPage === 'forgot-password') {
    return (
      <ForgotPasswordPage
        onBackToLoginClick={() => setCurrentPage('login')}
      />
    )
  }

  return (
    <LoginPage
      onRegisterClick={() => setCurrentPage('register')}
      onLoginSuccess={handleLoginSuccess}
      onForgotPasswordClick={() => setCurrentPage('forgot-password')}
    />
  )
}

export default App
