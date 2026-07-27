import logoImg from '../../logo/logo.jpeg'

interface SuccessProps {
  setAuthScreen: (screen: any) => void
  showNotification: (msg: string) => void
  variant?: 'register' | 'login'
  userName?: string
}

const VARIANT_COPY = {
  register: {
    title: 'Account created successfully!',
    description: 'Welcome to the DevSync workspace. Your infrastructure management environment is ready for configuration.'
  },
  login: {
    title: 'Session started successfully!',
    description: 'Welcome back to the DevSync workspace. Your infrastructure management environment is ready.'
  }
}

export default function Success({
  setAuthScreen,
  showNotification,
  variant = 'register',
  userName
}: SuccessProps) {
  const copy = VARIANT_COPY[variant]
  const description = variant === 'login' && userName
    ? `Welcome back, ${userName}. Your infrastructure management environment is ready.`
    : copy.description

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
          <h1 className="auth-app-title">DevSync</h1>
        </div>

        <div className="auth-card" style={{ alignItems: 'center', textAlign: 'center' }}>
          <div className="success-icon-container">
            <svg viewBox="0 0 24 24" width="48" height="48" stroke="#10b981" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="4" style={{ stroke: '#34d399' }} />
              <path d="M9 12l2 2 4-4" style={{ stroke: '#34d399' }} />
            </svg>
          </div>

          <h2 className="success-title">{copy.title}</h2>
          <p className="card-desc-text">
            {description}
          </p>

          <button 
            className="btn-auth-primary" 
            style={{ width: '100%' }}
            onClick={() => setAuthScreen('workspace')}
          >
            Start Dashboard <span className="auth-btn-icon-right">➔</span>
          </button>

          <div className="success-card-footer">
            <span className="success-footer-code">[&gt;_ auth_token: valid</span>
            <span className="success-footer-link" onClick={() => showNotification('Documentation opened')}>VIEW DOCS</span>
          </div>
        </div>

        <div className="success-page-footer">
          <span>node_v20.11.0 // session_id: 8f2a1b</span>
        </div>
        
        <div className="success-carousel-dots">
          <span className="carousel-dot"></span>
          <span className="carousel-dot active"></span>
          <span className="carousel-dot"></span>
        </div>
      </div>
    </div>
  )
}
