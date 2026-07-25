import React from 'react';
import { 
  Server, 
  Activity, 
  Users, 
  AlertTriangle, 
  ZoomIn, 
  Maximize2, 
  GitBranch, 
  FileText, 
  Sparkles, 
  CheckCircle,
  Code
} from 'lucide-react';

interface DashboardHomeProps {
  onNavigateToBlueprint: () => void;
  userName: string;
  tables?: any[];
  savedSchemas?: any[];
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({ onNavigateToBlueprint, userName, tables = [], savedSchemas = [] }) => {
  const hasData = tables.length > 0 || savedSchemas.length > 0;

  return (
    <div className="dashboard-home-container">
      {/* Welcome Message Header */}
      <div className="dashboard-welcome-header">
        <h1 className="welcome-title">Welcome back, {userName || 'Developer'}</h1>
        <p className="welcome-subtitle">Your production environment is stable. 3 services require manual review.</p>
      </div>

      {/* Quick Statistics Row */}
      <div className="quick-stats-row">
        <div className="stat-card">
          <div className="stat-icon-wrapper cluster">
            <Server size={18} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Cluster Status</span>
            <div className="stat-value-row">
              <span className="stat-value">US-EAST-1</span>
              <span className="status-dot green"></span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper uptime">
            <Activity size={18} />
          </div>
          <div className="stat-details">
            <span className="stat-label">System Uptime</span>
            <span className="stat-value">99.998%</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper instances">
            <Users size={18} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Active Services</span>
            <span className="stat-value">42 Instances</span>
          </div>
        </div>

        <div className="stat-card alert-highlight">
          <div className="stat-icon-wrapper pending-alerts">
            <AlertTriangle size={18} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Pending Alerts</span>
            <span className="stat-value text-red">3 Critical</span>
          </div>
        </div>
      </div>

      {/* Main Widgets Grid or Empty State */}
      {!hasData ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 20px',
          background: '#0d1117',
          borderRadius: '8px',
          border: '1px dashed #334155',
          marginTop: '24px',
          textAlign: 'center'
        }}>
          <Code size={48} style={{ color: '#64748b', marginBottom: '16px' }} />
          <h2 style={{ fontSize: '20px', color: '#e2e8f0', marginBottom: '8px' }}>Aún no hay datos</h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px', maxWidth: '400px' }}>
            Comienza a diseñar tu esquema de base de datos o carga un proyecto existente para ver las métricas aquí.
          </p>
          <button 
            className="btn-primary" 
            onClick={onNavigateToBlueprint}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
          >
            <Code size={16} />
            Ir a Blueprint
          </button>
        </div>
      ) : (
        <div className="dashboard-grid">
          
          {/* Left Big Column - Database Blueprint */}
          <div className="grid-item database-blueprint-widget" onClick={onNavigateToBlueprint}>
            <div className="widget-header">
              <div className="widget-title-group">
                <Code size={16} className="widget-icon primary-blue" />
                <h3>Database Blueprint</h3>
              </div>
              <span className="badge-stable">{tables.length} Tablas</span>
            </div>

            <div className="blueprint-canvas-preview">
              <div className="blueprint-grid-bg"></div>
              
              {tables.slice(0, 2).map((table: any, index: number) => (
                <div key={table.id} className={`blueprint-preview-card ${index === 1 ? 'second' : ''}`}>
                  <div className="preview-card-header">{table.name} Table</div>
                  <div className="preview-card-body">
                    {table.columns.slice(0, 3).map((col: any) => (
                      <div key={col.id} className="preview-row">
                        <span>{col.name}</span>
                        <span className={col.isPrimaryKey ? 'type-pk' : col.isForeignKey ? 'type-fk' : 'type-val'}>
                          {col.type} {col.isPrimaryKey ? '(PK)' : ''}
                        </span>
                      </div>
                    ))}
                    {table.columns.length > 3 && (
                      <div className="preview-row"><span style={{ color: '#64748b', fontStyle: 'italic' }}>+{table.columns.length - 3} más</span></div>
                    )}
                  </div>
                </div>
              ))}

              {/* Connecting line representational element */}
              {tables.length > 1 && <div className="blueprint-preview-connector"></div>}

              {/* Zoom and Expand overlays */}
              <div className="canvas-controls-overlay" onClick={(e) => e.stopPropagation()}>
                <button className="control-btn" onClick={onNavigateToBlueprint}><ZoomIn size={14} /></button>
                <button className="control-btn" onClick={onNavigateToBlueprint}><Maximize2 size={14} /></button>
              </div>
            </div>
          </div>

          {/* Right Column - Team Bandwidth */}
          <div className="grid-item team-bandwidth-widget">
            <div className="widget-header">
              <div className="widget-title-group">
                <Users size={16} className="widget-icon primary-green" />
                <h3>Team Bandwidth</h3>
              </div>
            </div>
            
            <div className="bandwidth-list">
              <div className="bandwidth-item">
                <div className="bandwidth-info">
                  <span className="member-name">Alan Watts</span>
                  <span className="member-capacity text-green">85% Capacity</span>
                </div>
                <div className="capacity-bar-bg">
                  <div className="capacity-bar-fill green" style={{ width: '85%' }}></div>
                </div>
              </div>

              <div className="bandwidth-item">
                <div className="bandwidth-info">
                  <span className="member-name">Alexander Gr.</span>
                  <span className="member-capacity text-blue">42% Capacity</span>
                </div>
                <div className="capacity-bar-bg">
                  <div className="capacity-bar-fill blue" style={{ width: '42%' }}></div>
                </div>
              </div>

              <div className="bandwidth-item">
                <div className="bandwidth-info">
                  <span className="member-name">You ({userName || 'Alex Dev'})</span>
                  <span className="member-capacity text-purple">68% Capacity</span>
                </div>
                <div className="capacity-bar-bg">
                  <div className="capacity-bar-fill purple" style={{ width: '68%' }}></div>
                </div>
              </div>

              <div className="bandwidth-tip">
                <Sparkles size={14} className="tip-icon" />
                <p>Recommended: Delegate <strong>Issue #402</strong> to Alexander to balance load.</p>
              </div>
            </div>
          </div>

          {/* Bottom Left - Merge Guard */}
          <div className="grid-item merge-guard-widget">
            <div className="widget-header">
              <div className="widget-title-group">
                <GitBranch size={16} className="widget-icon text-red" />
                <h3>Merge Guard</h3>
              </div>
              <span className="badge-alert">ALERT</span>
            </div>

            <div className="merge-list">
              <div className="merge-item conflict">
                <div className="merge-details">
                  <span className="merge-branch">Conflict: main ← feat/api</span>
                  <span className="merge-meta">3 files impacted</span>
                </div>
                <button className="btn-resolve">Resolve</button>
              </div>

              <div className="merge-item clean">
                <div className="merge-details">
                  <span className="merge-branch">Clean: main ← feat/ui-fix</span>
                  <span className="merge-meta">Verified by CI/CD</span>
                </div>
                <CheckCircle size={16} className="status-icon-check" />
              </div>
            </div>
          </div>

          {/* Bottom Middle - Recent Docs */}
          <div className="grid-item recent-docs-widget">
            <div className="widget-header">
              <div className="widget-title-group">
                <FileText size={16} className="widget-icon text-purple" />
                <h3>Recent Docs ({savedSchemas.length} Guardados)</h3>
              </div>
            </div>

            <div className="docs-list">
              {savedSchemas.slice(0, 3).map((schema: any) => (
                <div key={schema.id} className="doc-item">
                  <div className="doc-icon-box"><FileText size={14} /></div>
                  <div className="doc-details">
                    <span className="doc-name">{schema.name}</span>
                    <span className="doc-time">Actualizado {new Date(schema.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              {savedSchemas.length === 0 && (
                <div className="doc-item">
                  <span className="doc-name" style={{ color: '#64748b' }}>No hay esquemas guardados</span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Right - AI Insights */}
          <div className="grid-item ai-insights-widget">
            <div className="widget-header">
              <div className="widget-title-group">
                <Sparkles size={16} className="widget-icon text-purple" />
                <h3>AI Insights</h3>
              </div>
            </div>

            <div className="insights-body">
              <p className="insight-text">
                "Detected potential memory leak in <strong>useDataQuery.ts</strong>. Suggested fix: Ensure cleanup function is called on unmount."
              </p>
              <div className="insights-actions">
                <button className="btn-insight-apply">Apply Fix</button>
                <button className="btn-insight-dismiss">Dismiss</button>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
