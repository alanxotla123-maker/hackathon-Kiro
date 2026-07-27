import { useEffect, useState, useRef } from 'react'

interface GithubCallbackProps {
  setAuthScreen: (screen: any) => void
  showNotification: (msg: string) => void
}

export default function GithubCallback({ setAuthScreen, showNotification }: GithubCallbackProps) {
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const hasProcessed = useRef(false)

  useEffect(() => {
    // Evitar procesamiento doble en React StrictMode
    if (hasProcessed.current) return
    hasProcessed.current = true

    const processGithubAuth = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')
        const state = urlParams.get('state')
        const savedState = sessionStorage.getItem('github_oauth_state')

        // 1. Validar parámetros
        if (!code) {
          throw new Error('No se recibió el código de autorización de GitHub.')
        }

        // 2. Validar protección CSRF (State)
        if (!state || state !== savedState) {
          throw new Error('Validación de seguridad (state) fallida. Posible ataque CSRF.')
        }

        // Limpiar el state usado
        sessionStorage.removeItem('github_oauth_state')

        // 3. Intercambiar el código por un token en nuestro BACKEND
        // NOTA: Reemplazar con la URL real de tu backend
        // const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
        
        // Simulando petición al backend por ahora para demostrar el flujo
        /*
        const response = await fetch(`${backendUrl}/api/auth/github`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Error al autenticar con GitHub')
        }
        
        const data = await response.json()
        */

        // SIMULACIÓN: Esperar 1.5s y hacer un "login exitoso" falso
        await new Promise(resolve => setTimeout(resolve, 1500))
        const mockData = { user: { name: 'GitHub Developer' } }

        // 4. Iniciar sesión en el frontend
        setStatus('success')
        localStorage.setItem('userFullName', mockData.user.name)
        
        // Limpiar la URL de la barra de direcciones sin recargar la página
        window.history.replaceState({}, document.title, '/')
        
        // Redirigir al workspace
        setTimeout(() => {
          setAuthScreen('workspace')
          showNotification(`Autenticado vía GitHub como ${mockData.user.name}`)
        }, 500)

      } catch (error: any) {
        console.error('Error en GitHub OAuth callback:', error)
        setStatus('error')
        setErrorMessage(error.message || 'Ocurrió un error inesperado durante la autenticación.')
        
        // Limpiar la URL
        window.history.replaceState({}, document.title, '/')
      }
    }

    processGithubAuth()
  }, [setAuthScreen, showNotification])

  return (
    <div className="auth-page">
      <div className="auth-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px' }}>
        
        {status === 'loading' && (
          <>
            <div style={{ marginBottom: '20px' }}>
               <svg className="github-icon-svg" viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'pulse 2s infinite' }}>
                 <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
               </svg>
            </div>
            <h2 className="auth-app-title" style={{ fontSize: '24px', marginBottom: '10px' }}>Autenticando con GitHub</h2>
            <p className="auth-app-subtitle">Estableciendo conexión segura con tu cuenta...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="auth-alert-error spec-alert-bg" style={{ marginBottom: '24px', width: '100%', textAlign: 'left' }}>
              <div className="auth-alert-icon spec-alert-icon-color">!</div>
              <div className="auth-alert-content">
                <div className="auth-alert-title spec-alert-text-color">Error de Autenticación</div>
                <div className="auth-alert-desc">{errorMessage}</div>
              </div>
            </div>
            <button className="btn-auth-provision" onClick={() => setAuthScreen('login')}>
              Volver al inicio de sesión
            </button>
          </>
        )}

        {status === 'success' && (
          <>
             <div style={{ color: '#10b981', marginBottom: '20px' }}>
                <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
             </div>
             <h2 className="auth-app-title" style={{ fontSize: '24px' }}>¡Conexión Exitosa!</h2>
             <p className="auth-app-subtitle">Redirigiendo a tu espacio de trabajo...</p>
          </>
        )}

      </div>
    </div>
  )
}
