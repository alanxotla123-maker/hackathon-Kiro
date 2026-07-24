import { useState } from 'react'
import Login from './components/Auth/Login'
import Register from './components/Auth/Register'
import ForgotPassword from './components/Auth/ForgotPassword'
import Success from './components/Auth/Success'
import DatabaseDesigner from './components/DatabaseDesigner/DatabaseDesigner'
import './App.css'

export default function App() {
  const [authScreen, setAuthScreen] = useState<'login' | 'register' | 'forgot' | 'success' | 'workspace'>(() => {
    const saved = localStorage.getItem('authSession')
    return saved === 'active' ? 'workspace' : 'login'
  })
  const [authInputs, setAuthInputs] = useState({ fullName: '', username: '', password: '' })
  const [authMessage, setAuthMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [registerConflict, setRegisterConflict] = useState<boolean>(false)
  const [notification, setNotification] = useState<string | null>(null)

  const handleSetAuthScreen = (screen: 'login' | 'register' | 'forgot' | 'success' | 'workspace') => {
    setAuthScreen(screen)
    if (screen === 'workspace') {
      localStorage.setItem('authSession', 'active')
    } else if (screen === 'login') {
      localStorage.removeItem('authSession')
    }
  }

  const showNotification = (message: string) => {
    setNotification(message)
    setTimeout(() => setNotification(null), 3000)
  }

  return (
    <div className="app-container">
      {/* Success Notification Alert */}
      {notification && (
        <div className="session-toast">
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="#34d399" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          <span>{notification}</span>
        </div>
      )}

      {authScreen === 'login' && (
        <Login
          authInputs={authInputs}
          setAuthInputs={setAuthInputs}
          authMessage={authMessage}
          setAuthMessage={setAuthMessage}
          setAuthScreen={handleSetAuthScreen}
          showNotification={showNotification}
        />
      )}

      {authScreen === 'register' && (
        <Register
          authInputs={authInputs}
          setAuthInputs={setAuthInputs}
          registerConflict={registerConflict}
          setRegisterConflict={setRegisterConflict}
          setAuthScreen={handleSetAuthScreen}
          showNotification={showNotification}
        />
      )}

      {authScreen === 'forgot' && (
        <ForgotPassword
          authInputs={authInputs}
          setAuthInputs={setAuthInputs}
          setAuthScreen={handleSetAuthScreen}
          showNotification={showNotification}
        />
      )}

      {authScreen === 'success' && (
        <Success
          setAuthScreen={handleSetAuthScreen}
          showNotification={showNotification}
        />
      )}

      {authScreen === 'workspace' && (
        <DatabaseDesigner
          setAuthScreen={handleSetAuthScreen}
          showNotification={showNotification}
        />
      )}
    </div>
  )
}
