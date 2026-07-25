import { useState } from 'react'
import Login from './components/Auth/Login'
import Register from './components/Auth/Register'
import ForgotPassword from './components/Auth/ForgotPassword'
import Success from './components/Auth/Success'
import DatabaseDesigner from './components/DatabaseDesigner/DatabaseDesigner'
import DeepLint from './components/DeepLint/DeepLint'
import AIPoc from './components/AIPoc/AIPoc'
import './App.css'

export default function App() {
  const [authScreen, setAuthScreen] = useState<'login' | 'register' | 'forgot' | 'success' | 'workspace' | 'deeplint' | 'aipoc'>(() => {
    const saved = localStorage.getItem('authSession')
    return saved === 'active' ? 'workspace' : 'login'
  })
  const [authInputs, setAuthInputs] = useState({ fullName: '', username: '', password: '' })
  const [authMessage, setAuthMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [registerConflict, setRegisterConflict] = useState<boolean>(false)
  const [notification, setNotification] = useState<string | null>(null)

  const handleSetAuthScreen = (screen: 'login' | 'register' | 'forgot' | 'success' | 'workspace' | 'deeplint' | 'aipoc') => {
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
        <div style={{
          position: 'fixed',
          top: '64px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#1e293b',
          color: '#38bdf8',
          padding: '8px 16px',
          borderRadius: '20px',
          border: '1px solid #38bdf8',
          fontSize: '12px',
          fontWeight: 600,
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          zIndex: 100,
          pointerEvents: 'none'
        }}>
          {notification}
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

      {authScreen === 'deeplint' && (
        <DeepLint onBack={() => handleSetAuthScreen('workspace')} />
      )}

      {authScreen === 'aipoc' && (
        <AIPoc onBack={() => handleSetAuthScreen('workspace')} />
      )}
    </div>
  )
}
