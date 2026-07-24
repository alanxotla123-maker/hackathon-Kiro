import React, { useState } from 'react'
import { Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react'
import logoImg from '../../logo/logo.jpeg'

interface LoginProps {
  authInputs: any
  setAuthInputs: React.Dispatch<React.SetStateAction<any>>
  authMessage: any
  setAuthMessage: React.Dispatch<React.SetStateAction<any>>
  setAuthScreen: (screen: any) => void
  showNotification: (msg: string) => void
}

export default function Login({
  authInputs,
  setAuthInputs,
  authMessage,
  setAuthMessage,
  setAuthScreen,
  showNotification
}: LoginProps) {
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async () => {
    if (!authInputs.username || !authInputs.password) {
      setAuthMessage({ type: 'error', text: 'Por favor introduce tu usuario y contraseña' })
      return
    }
    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: authInputs.username, password: authInputs.password }),
      })
      const data = await response.json()
      if (!response.ok) {
        setAuthMessage({ type: 'error', text: 'Invalid username or password' })
        return
      }
      setAuthMessage(null)
      localStorage.setItem('userFullName', data.user.name)
      setAuthScreen('workspace')
      showNotification(`Welcome back, ${data.user.name}!`)
    } catch (err) {
      setAuthMessage({ type: 'error', text: 'Connection error' })
    }
  }

  const isError = authMessage && authMessage.type === 'error'

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-logo-wrapper">
          <div className="auth-logo">
            <img src={logoImg} alt="DevSync Logo" style={{ width: '100%', height: '100%', borderRadius: '8px', objectFit: 'cover' }} />
          </div>
          <div className="auth-logo-text">DevSync</div>
        </div>

        <div className="auth-header-info">
          <h1 className="auth-app-title">Access Developer Node</h1>
          <p className="auth-app-subtitle">Connect to your synchronized workspace environment</p>
        </div>

        {isError && (
          <div className="auth-alert-error spec-alert-bg" style={{ marginBottom: '24px' }}>
            <div className="auth-alert-icon spec-alert-icon-color">!</div>
            <div className="auth-alert-content">
              <div className="auth-alert-title spec-alert-text-color">Authentication Failure</div>
              <div className="auth-alert-desc">Invalid username or password. Please verify your credentials and try again.</div>
            </div>
          </div>
        )}

        <div className="auth-card">
          <button className="btn-github-auth-dark" onClick={() => { localStorage.setItem('userFullName', 'Github Developer'); setAuthScreen('workspace'); showNotification('Welcome back, Github Developer!'); }}>
            <svg className="github-icon-svg" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
            Sign in with GitHub
          </button>

          <div className="auth-divider">
            <span>OR USE PROTOCOL</span>
          </div>

          <div className="auth-form-group">
            <div className="auth-label-row">
              <label className="auth-label">TERMINAL ADDRESS</label>
            </div>
            <div className={`auth-input-wrapper ${isError ? 'conflict-border' : ''}`}>
              <User size={16} className="auth-input-icon" />
              <input 
                type="email" 
                placeholder="developer@domain.com" 
                className="auth-input"
                value={authInputs.username}
                onChange={(e) => setAuthInputs((prev: any) => ({ ...prev, username: e.target.value }))}
              />
              {isError && (
                <span className="auth-input-conflict-icon" style={{ right: '12px', top: '50%', transform: 'translateY(-50%)', position: 'absolute' }}>⚠️</span>
              )}
            </div>
          </div>

          <div className="auth-form-group">
            <div className="auth-label-row">
              <label className="auth-label">ACCESS KEY</label>
              <span className="auth-link-spec" style={{ fontSize: '11px', cursor: 'pointer' }} onClick={() => { setAuthScreen('forgot'); setAuthMessage(null); }}>Recover</span>
            </div>
            <div className={`auth-input-wrapper ${isError ? 'conflict-border' : ''}`}>
              <Lock size={16} className="auth-input-icon" />
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="••••••••" 
                className="auth-input"
                value={authInputs.password}
                onChange={(e) => setAuthInputs((prev: any) => ({ ...prev, password: e.target.value }))}
              />
              <button className="auth-eye-btn" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button className="btn-auth-provision" onClick={handleLogin}>
            Initialize Session <ArrowRight size={16} style={{ marginLeft: 6 }} />
          </button>
        </div>

        <p className="auth-footer-text">
          Don't have an account? <span className="auth-link-spec" style={{ cursor: 'pointer' }} onClick={() => { setAuthScreen('register'); setAuthMessage(null); }}>Create Developer Account</span>
        </p>

        <div className="auth-page-footer-register">
          <div className="footer-register-left">
            <span className="footer-status-dot active"></span>
            <span>SYSTEMS NOMINAL</span>
          </div>
          <div className="footer-register-middle">
            <span>CLUSTER: US-EAST-1</span>
          </div>
          <div className="footer-register-right">
            <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2" fill="none" style={{ marginRight: 4, transform: 'translateY(1px)' }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>AES-256 GCM</span>
          </div>
        </div>
      </div>
    </div>
  )
}
