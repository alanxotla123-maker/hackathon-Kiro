import React, { useState, useRef } from 'react'
import { 
  Shield, 
  MapPin, 
  Laptop, 
  Lock, 
  History, 
  ChevronRight, 
  CheckCircle2, 
  LogOut, 
  User,
  Camera,
  Info
} from 'lucide-react'

interface UserProfileViewProps {
  userName: string
  setAuthScreen: (screen: 'login' | 'register' | 'forgot' | 'success' | 'workspace') => void
  showNotification: (msg: string) => void
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({ 
  userName, 
  setAuthScreen, 
  showNotification 
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [fullName, setFullName] = useState(userName)
  const [handle, setHandle] = useState(userName.toLowerCase().replace(/\s+/g, '_') + '_99')
  const [bio, setBio] = useState('Full-stack engineer specializing in high-concurrency systems and distributed architectures. Currently maintaining the DevSync Engine and exploring Rust for low-level optimizations.')
  const [email, setEmail] = useState(`${userName.toLowerCase().replace(/\s+/g, '')}@devsync.io`)
  const [workstationId, setWorkstationId] = useState('NODE_742_X_DEV')
  const githubUser = `${userName.toLowerCase().replace(/\s+/g, '_')}-official`
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profileImageUrl, setProfileImageUrl] = useState(localStorage.getItem('profileImageUrl') || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80")

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('avatar', file);
      formData.append('email', email);

      showNotification('Subiendo foto a S3...');
      try {
        const response = await fetch('http://localhost:3000/api/upload/avatar', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        if (response.ok) {
          setProfileImageUrl(data.profileImage);
          localStorage.setItem('profileImageUrl', data.profileImage);
          showNotification('¡Foto de perfil actualizada en S3!');
        } else {
          showNotification('Error: ' + data.error);
        }
      } catch (err) {
        showNotification('Fallo al subir la imagen');
        console.error(err);
      }
    }
  }

  const handleSaveChanges = () => {
    showNotification('Configuración guardada correctamente!')
    setIsEditing(false)
  }

  const handleLogOut = () => {
    setAuthScreen('login')
    showNotification('Sesión cerrada con éxito')
  }

  if (isEditing) {
    return (
      <div style={{ padding: '24px 32px', overflowY: 'auto', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '24px', backgroundColor: '#090b0f' }}>
        
        {/* Header Title */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#e2e8f0', margin: 0 }}>Edit Profile</h1>
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
            Manage your public developer identity and personal information across DevSync platforms.
          </p>
        </div>

        {/* Edit Layout Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '300px 1fr',
          gap: '24px',
          alignItems: 'start'
        }}>
          
          {/* Left Column: Avatar & Status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Avatar Card */}
            <div style={{
              padding: '24px',
              borderRadius: '12px',
              backgroundColor: '#0d1117',
              border: '1px solid #1f2937',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '16px'
            }}>
              {/* Photo Box container */}
              <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                <img 
                  src={profileImageUrl} 
                  alt="Avatar" 
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '12px',
                    objectFit: 'cover',
                    border: '1px solid #1f2937'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: '-6px',
                  right: '-6px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  borderRadius: '6px',
                  padding: '5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                  border: '2px solid #0d1117'
                }} title="Change Photo" onClick={() => fileInputRef.current?.click()}>
                  <Camera size={12} />
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#e2e8f0', margin: '0 0 4px 0' }}>{fullName}</h3>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Lead Engineer @ SystemCore</span>
              </div>

              <input 
                type="file" 
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handlePhotoUpload}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: '#1f2937',
                  color: '#e2e8f0',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Upload New Photo
              </button>

              <button 
                onClick={() => showNotification('Avatar removed')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#f87171',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Remove
              </button>
            </div>

            {/* Account Status Card */}
            <div style={{
              padding: '16px 20px',
              borderRadius: '12px',
              backgroundColor: '#0d1117',
              border: '1px solid #1f2937',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <span style={{ fontSize: '9px', fontWeight: 600, color: '#64748b', letterSpacing: '0.05em' }}>ACCOUNT STATUS</span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={12} style={{ color: '#10b981' }} />
                  Vetted Developer
                </span>
                <span style={{
                  fontSize: '9px',
                  fontWeight: 'bold',
                  color: '#10b981',
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.15)',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>
                  ACTIVE
                </span>
              </div>
            </div>

          </div>

          {/* Right Column: Editable Fields */}
          <div style={{
            padding: '24px',
            borderRadius: '12px',
            backgroundColor: '#0d1117',
            border: '1px solid #1f2937',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            {/* Developer Handle field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '10px', fontWeight: 600, color: '#64748b', letterSpacing: '0.05em' }}>DEVELOPER HANDLE</label>
              <input 
                type="text" 
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  backgroundColor: '#090b0f',
                  border: '1px solid #1f2937',
                  color: '#e2e8f0',
                  fontSize: '12px',
                  outline: 'none'
                }}
              />
            </div>

            {/* Bio field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '10px', fontWeight: 600, color: '#64748b', letterSpacing: '0.05em' }}>BIO / DESCRIPTION</label>
              <textarea 
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 500))}
                rows={4}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  backgroundColor: '#090b0f',
                  border: '1px solid #1f2937',
                  color: '#e2e8f0',
                  fontSize: '12px',
                  outline: 'none',
                  resize: 'none',
                  lineHeight: 1.5
                }}
              />
              <span style={{ fontSize: '10px', color: '#64748b', alignSelf: 'flex-end' }}>
                {bio.length} / 500 CHARACTERS
              </span>
            </div>

            {/* Inputs: Full name & Locked Email */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '10px', fontWeight: 600, color: '#64748b', letterSpacing: '0.05em' }}>FULL NAME</label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    backgroundColor: '#090b0f',
                    border: '1px solid #1f2937',
                    color: '#e2e8f0',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '10px', fontWeight: 600, color: '#64748b', letterSpacing: '0.05em' }}>PRIMARY EMAIL (LOCKED)</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    value={email}
                    disabled
                    style={{
                      width: '100%',
                      padding: '8px 36px 8px 10px',
                      borderRadius: '6px',
                      backgroundColor: '#090b0f',
                      border: '1px solid #1f2937',
                      color: '#64748b',
                      fontSize: '12px',
                      outline: 'none',
                      cursor: 'not-allowed'
                    }}
                  />
                  <Lock size={12} style={{ color: '#64748b', position: 'absolute', right: '10px' }} />
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', borderTop: '1px solid #1f2937', paddingTop: '16px' }}>
              <button 
                onClick={() => setIsEditing(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  color: '#64748b',
                  border: '1px solid #1f2937',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveChanges}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Save Changes
              </button>
            </div>

          </div>

        </div>

        {/* SSO Warning banner */}
        <div style={{
          display: 'flex',
          gap: '12px',
          padding: '16px',
          borderRadius: '8px',
          backgroundColor: 'rgba(56, 189, 248, 0.04)',
          border: '1px solid rgba(56, 189, 248, 0.12)',
          alignItems: 'flex-start'
        }}>
          <Info size={16} style={{ color: '#38bdf8', marginTop: '2px', flexShrink: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0' }}>SSO Authentication</span>
            <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
              Your email and identity provider settings are managed by your organization's SSO. Contact your system administrator to update restricted fields.
            </p>
          </div>
        </div>

      </div>
    )
  }

  return (
    <div style={{ padding: '24px 32px', overflowY: 'auto', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '24px', backgroundColor: '#090b0f' }}>
      
      {/* Top Profile Summary Card */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '24px',
        borderRadius: '12px',
        backgroundColor: '#0d1117',
        border: '1px solid #1f2937',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        gap: '24px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          {/* Avatar Container */}
          <div style={{ position: 'relative' }}>
            <img 
              src={profileImageUrl} 
              alt="User Profile" 
              style={{
                width: '88px',
                height: '88px',
                borderRadius: '12px',
                objectFit: 'cover',
                border: '2px solid #38bdf8',
                boxShadow: '0 0 12px rgba(56, 189, 248, 0.3)'
              }}
            />
            <span style={{
              position: 'absolute',
              bottom: '-4px',
              right: '-4px',
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              border: '2.5px solid #0d1117',
              boxShadow: '0 0 8px #10b981'
            }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#e2e8f0', margin: 0 }}>{fullName}</h1>
              <span style={{ fontSize: '12px', color: '#64748b' }}>@{handle}</span>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '4px', 
                padding: '4px 8px', 
                borderRadius: '6px', 
                backgroundColor: 'rgba(56, 189, 248, 0.08)', 
                color: '#38bdf8', 
                fontSize: '11px', 
                border: '1px solid rgba(56, 189, 248, 0.15)' 
              }}>
                <Shield size={11} />
                Senior Infrastructure Engineer
              </span>
              <span style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '4px', 
                padding: '4px 8px', 
                borderRadius: '6px', 
                backgroundColor: 'rgba(100, 116, 139, 0.08)', 
                color: '#94a3b8', 
                fontSize: '11px', 
                border: '1px solid rgba(100, 116, 139, 0.15)' 
              }}>
                <MapPin size={11} />
                Remote / SF Node
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, maxWidth: '580px', lineHeight: 1.5 }}>
              {bio}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => setIsEditing(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            Edit Profile
          </button>
          <button 
            onClick={handleLogOut}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: 'transparent',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <LogOut size={12} />
            Log Out
          </button>
        </div>
      </div>

      {/* Main Grid Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '24px',
        alignItems: 'start'
      }}>
        
        {/* Left Column: Account Details */}
        <div style={{
          padding: '24px',
          borderRadius: '12px',
          backgroundColor: '#0d1117',
          border: '1px solid #1f2937',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #1f2937', paddingBottom: '12px' }}>
            <User size={15} style={{ color: '#38bdf8' }} />
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0', margin: 0 }}>Account Details</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '10px', fontWeight: 600, color: '#64748b', letterSpacing: '0.05em' }}>EMAIL ADDRESS</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 36px 8px 10px',
                    borderRadius: '6px',
                    backgroundColor: '#090b0f',
                    border: '1px solid #1f2937',
                    color: '#e2e8f0',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                />
                <CheckCircle2 size={14} style={{ color: '#10b981', position: 'absolute', right: '10px' }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '10px', fontWeight: 600, color: '#64748b', letterSpacing: '0.05em' }}>WORKSTATION ID</label>
              <input 
                type="text" 
                value={workstationId}
                onChange={(e) => setWorkstationId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  backgroundColor: '#090b0f',
                  border: '1px solid #1f2937',
                  color: '#e2e8f0',
                  fontSize: '12px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '10px', fontWeight: 600, color: '#64748b', letterSpacing: '0.05em' }}>GITHUB INTEGRATION STATUS</label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: '#090b0f',
              border: '1px solid #1f2937'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#e2e8f0' }}><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '12px', color: '#e2e8f0' }}>Connected as @{githubUser}</span>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>Last synced 14 minutes ago</span>
                </div>
              </div>
              <button 
                onClick={() => showNotification('GitHub re-authentication started')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#38bdf8',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Re-authenticate
              </button>
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', borderTop: '1px solid #1f2937', paddingTop: '16px' }}>
            <button 
              onClick={() => showNotification('Changes discarded')}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Discard
            </button>
            <button 
              onClick={handleSaveChanges}
              style={{
                padding: '8px 16px',
                backgroundColor: '#1f2937',
                color: '#e2e8f0',
                border: '1px solid #374151',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Save Changes
            </button>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Active Workspace */}
          <div style={{
            padding: '20px',
            borderRadius: '12px',
            backgroundColor: '#0d1117',
            border: '1px solid #1f2937',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <h3 style={{ fontSize: '10px', fontWeight: 600, color: '#64748b', letterSpacing: '0.05em', margin: 0 }}>ACTIVE WORKSPACE</h3>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: '#090b0f',
              border: '1px solid #1f2937'
            }}>
              <Laptop size={16} style={{ color: '#38bdf8' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0' }}>Production-Cluster-Alpha</span>
                <span style={{ fontSize: '10px', color: '#64748b' }}>Primary node: us-east-1</span>
              </div>
            </div>
            <button 
              onClick={() => showNotification('Switching workspace node...')}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#1f2937',
                color: '#e2e8f0',
                border: '1px solid #374151',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Switch Node
            </button>
          </div>

          {/* Security Card */}
          <div style={{
            padding: '20px',
            borderRadius: '12px',
            backgroundColor: '#0d1117',
            border: '1px solid #1f2937',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <h3 style={{ fontSize: '10px', fontWeight: 600, color: '#64748b', letterSpacing: '0.05em', margin: 0 }}>SECURITY</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Row 1: Two-Factor Auth */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Lock size={14} style={{ color: '#64748b' }} />
                  <span style={{ fontSize: '12px', color: '#e2e8f0' }}>Two-Factor Auth</span>
                </div>
                <span style={{ 
                  fontSize: '9px', 
                  fontWeight: 'bold', 
                  color: '#10b981', 
                  backgroundColor: 'rgba(16, 185, 129, 0.08)', 
                  border: '1px solid rgba(16, 185, 129, 0.15)',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>
                  ENABLED
                </span>
              </div>

              {/* Row 2: Login History */}
              <div 
                onClick={() => showNotification('Loading login history...')}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <History size={14} style={{ color: '#64748b' }} />
                  <span style={{ fontSize: '12px', color: '#e2e8f0' }}>Login History</span>
                </div>
                <ChevronRight size={14} style={{ color: '#64748b' }} />
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}
