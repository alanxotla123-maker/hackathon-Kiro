import React, { useEffect, useState } from 'react';
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
import type { Table } from '../DatabaseDesigner/types';
import type { Member as StackAgentMember } from '../StackAgent/StackAgent';

interface DocifyDocument {
  id: number;
  name: string;
  repoUrl: string;
  generatedReadme: string;
  createdAt: string;
  updatedAt: string;
}

interface BranchStatus {
  branch: string;
  aheadOfMain: number;
  behindMain: number;
}

interface DeepLintSaveRecord {
  id: number;
  name: string;
  repoUrl: string;
  fileName: string;
  createdAt: string;
  updatedAt: string;
}

interface DashboardHomeProps {
  onNavigateToBlueprint: () => void;
  onNavigateToDocify: () => void;
  onNavigateToDeepLint: () => void;
  userName: string;
  tables: Table[];
  teamMembers: StackAgentMember[];
}

const typeBadgeClass = (col: Table['columns'][number]) => {
  if (col.isPrimaryKey) return 'type-pk';
  if (col.isForeignKey) return 'type-fk';
  return 'type-val';
};

const timeAgo = (isoDate: string): string => {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

// A doc counts as "updated" only if it was edited more than a minute after creation (avoids false positives from clock/serialization drift).
const docTimeLabel = (doc: DocifyDocument): string => {
  const wasEdited = new Date(doc.updatedAt).getTime() - new Date(doc.createdAt).getTime() > 60000;
  return wasEdited ? `Updated ${timeAgo(doc.updatedAt)}` : `Generated ${timeAgo(doc.createdAt)}`;
};

const formatUptime = (totalSeconds: number): string => {
  const seconds = Math.floor(totalSeconds);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
};

interface HealthInfo {
  region: string;
  uptimeSeconds: number;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({ onNavigateToBlueprint, onNavigateToDocify, onNavigateToDeepLint, userName, tables, teamMembers }) => {
  const previewTables = tables.slice(0, 2);
  const extraTableCount = Math.max(0, tables.length - previewTables.length);

  const previewMembers = teamMembers.slice(0, 4);
  const extraMemberCount = Math.max(0, teamMembers.length - previewMembers.length);

  const [recentDocs, setRecentDocs] = useState<DocifyDocument[]>([]);
  const [docsLoadFailed, setDocsLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('http://localhost:3000/api/doc-generator/docs')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('request failed'))))
      .then((docs) => { if (!cancelled) setRecentDocs(docs); })
      .catch(() => { if (!cancelled) setDocsLoadFailed(true); });
    return () => { cancelled = true; };
  }, []);

  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    let cancelled = false;
    fetch('http://localhost:3000/api/health')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('request failed'))))
      .then((data) => { if (!cancelled) { setHealth(data); setBackendStatus('online'); } })
      .catch(() => { if (!cancelled) setBackendStatus('offline'); });
    return () => { cancelled = true; };
  }, []);

  const [unassignedTaskCount, setUnassignedTaskCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('http://localhost:3000/api/task-allocator/tasks')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('request failed'))))
      .then((tasks: Array<{ assignedToId: number | null }>) => {
        if (!cancelled) setUnassignedTaskCount(tasks.filter((t) => !t.assignedToId).length);
      })
      .catch(() => { if (!cancelled) setUnassignedTaskCount(null); });
    return () => { cancelled = true; };
  }, []);

  const previewDocs = recentDocs.slice(0, 3);
  const extraDocCount = Math.max(0, recentDocs.length - previewDocs.length);

  const [branchStatus, setBranchStatus] = useState<BranchStatus[]>([]);
  const [branchStatusFailed, setBranchStatusFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('http://localhost:3000/api/branch-sync/team-status')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('request failed'))))
      .then((data: { branches: BranchStatus[] }) => { if (!cancelled) setBranchStatus(data.branches); })
      .catch(() => { if (!cancelled) setBranchStatusFailed(true); });
    return () => { cancelled = true; };
  }, []);

  const previewBranches = branchStatus.slice(0, 4);
  const extraBranchCount = Math.max(0, branchStatus.length - previewBranches.length);
  const pendingBranchCount = branchStatus.filter((b) => b.aheadOfMain > 0).length;

  const [latestInsight, setLatestInsight] = useState<DeepLintSaveRecord | null>(null);
  const [insightLoadFailed, setInsightLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('http://localhost:3000/api/deeplint')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('request failed'))))
      .then((saves: DeepLintSaveRecord[]) => { if (!cancelled) setLatestInsight(saves[0] || null); })
      .catch(() => { if (!cancelled) setInsightLoadFailed(true); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="dashboard-home-container">
      {/* Welcome Message Header */}
      <div className="dashboard-welcome-header">
        <h1 className="welcome-title">Welcome back, {userName || 'Developer'}</h1>
        <p className="welcome-subtitle">
          {backendStatus === 'offline'
            ? 'Backend is unreachable — some data may be out of date.'
            : unassignedTaskCount
              ? `${unassignedTaskCount} task${unassignedTaskCount === 1 ? '' : 's'} awaiting assignment.`
              : 'All tasks are assigned. Your workspace is up to date.'}
        </p>
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
              <span className="stat-value">
                {backendStatus === 'online' && health ? health.region.toUpperCase() : backendStatus === 'offline' ? 'Offline' : 'Checking...'}
              </span>
              <span className={`status-dot ${backendStatus === 'online' ? 'green' : backendStatus === 'offline' ? 'red' : 'gray'}`}></span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper uptime">
            <Activity size={18} />
          </div>
          <div className="stat-details">
            <span className="stat-label">System Uptime</span>
            <span className="stat-value">
              {backendStatus === 'online' && health ? `Up ${formatUptime(health.uptimeSeconds)}` : backendStatus === 'offline' ? 'Offline' : 'Checking...'}
            </span>
          </div>
        </div>

        <div className={`stat-card${(unassignedTaskCount ?? 0) > 0 ? ' alert-highlight' : ''}`}>
          <div className="stat-icon-wrapper pending-alerts">
            <AlertTriangle size={18} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Pending Tasks</span>
            <span className={unassignedTaskCount ? 'stat-value text-red' : 'stat-value'}>
              {unassignedTaskCount !== null ? `${unassignedTaskCount} Unassigned` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Widgets Grid */}
      <div className="dashboard-grid">
        
        {/* Left Big Column - Database Blueprint */}
        <div className="grid-item database-blueprint-widget" onClick={onNavigateToBlueprint}>
          <div className="widget-header">
            <div className="widget-title-group">
              <Code size={16} className="widget-icon primary-blue" />
              <h3>Database Blueprint</h3>
            </div>
            <span className="badge-stable">{tables.length} {tables.length === 1 ? 'tabla' : 'tablas'}</span>
          </div>

          <div className="blueprint-canvas-preview">
            <div className="blueprint-grid-bg"></div>

            {previewTables.length === 0 && (
              <div className="blueprint-preview-empty">
                <p>Aún no hay tablas en el schema. Crea una en el Database Designer.</p>
              </div>
            )}

            {previewTables.map((table, idx) => (
              <React.Fragment key={table.id}>
                {idx === 1 && <div className="blueprint-preview-connector"></div>}
                <div className={`blueprint-preview-card${idx === 1 ? ' second' : ''}`}>
                  <div className="preview-card-header">{table.name || 'Sin nombre'}</div>
                  <div className="preview-card-body">
                    {table.columns.slice(0, 4).map((col) => (
                      <div className="preview-row" key={col.id}>
                        <span>{col.name}</span>
                        <span className={typeBadgeClass(col)}>
                          {col.isPrimaryKey ? `${col.type.toUpperCase()} (PK)` : col.isForeignKey ? 'FK' : col.type.toUpperCase()}
                        </span>
                      </div>
                    ))}
                    {table.columns.length > 4 && (
                      <div className="preview-row preview-row-more"><span>+{table.columns.length - 4} columnas más</span></div>
                    )}
                  </div>
                </div>
              </React.Fragment>
            ))}

            {extraTableCount > 0 && (
              <div className="blueprint-preview-more-tables">+{extraTableCount} {extraTableCount === 1 ? 'tabla más' : 'tablas más'}</div>
            )}

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
            <span className="badge-stable">{teamMembers.length} {teamMembers.length === 1 ? 'integrante' : 'integrantes'}</span>
          </div>

          <div className="bandwidth-list">
            {previewMembers.length === 0 && (
              <div className="blueprint-preview-empty">
                <p>Aún no hay integrantes. Agrégalos en StackAgent.</p>
              </div>
            )}

            {previewMembers.map((member) => (
              <div className="bandwidth-item" key={member.id}>
                <div className="bandwidth-info">
                  <span className="member-name">{member.name}</span>
                  <span className={`member-role-badge role-${member.role.toLowerCase()}`}>{member.role}</span>
                </div>
                <div className="member-meta-row">
                  <span className="member-level">{member.level}</span>
                  <span>•</span>
                  <span className="member-stack">{member.stack || 'Sin stack definido'}</span>
                </div>
              </div>
            ))}

            {extraMemberCount > 0 && (
              <div className="list-more-badge">+{extraMemberCount} {extraMemberCount === 1 ? 'integrante más' : 'integrantes más'}</div>
            )}
          </div>
        </div>

        {/* Bottom Left - Merge Guard */}
        <div className="grid-item merge-guard-widget">
          <div className="widget-header">
            <div className="widget-title-group">
              <GitBranch size={16} className={pendingBranchCount > 0 ? 'widget-icon text-red' : 'widget-icon primary-green'} />
              <h3>Merge Guard</h3>
            </div>
            {pendingBranchCount > 0 ? (
              <span className="badge-alert">{pendingBranchCount} PENDING</span>
            ) : (
              <span className="badge-stable">All synced</span>
            )}
          </div>

          <div className="merge-list">
            {branchStatusFailed && (
              <div className="blueprint-preview-empty"><p>No se pudo leer el estado de git.</p></div>
            )}

            {!branchStatusFailed && previewBranches.length === 0 && (
              <div className="blueprint-preview-empty"><p>No hay otras ramas para comparar con main.</p></div>
            )}

            {previewBranches.map((b) => (
              <div className={`merge-item ${b.aheadOfMain > 0 ? 'pending' : 'synced'}`} key={b.branch}>
                <div className="merge-details">
                  <span className="merge-branch">{b.branch} → main</span>
                  <span className="merge-meta">
                    {b.aheadOfMain > 0 ? `${b.aheadOfMain} commit${b.aheadOfMain === 1 ? '' : 's'} ahead` : 'Up to date'}
                    {b.behindMain > 0 ? `, ${b.behindMain} behind` : ''}
                  </span>
                </div>
                {b.aheadOfMain === 0 && <CheckCircle size={16} className="status-icon-check" />}
              </div>
            ))}

            {extraBranchCount > 0 && (
              <div className="list-more-badge">+{extraBranchCount} more</div>
            )}
          </div>
        </div>

        {/* Bottom Middle - Recent Docs */}
        <div className="grid-item recent-docs-widget" onClick={onNavigateToDocify}>
          <div className="widget-header">
            <div className="widget-title-group">
              <FileText size={16} className="widget-icon text-purple" />
              <h3>Recent Docs</h3>
            </div>
          </div>

          <div className="docs-list">
            {docsLoadFailed && (
              <div className="blueprint-preview-empty"><p>No se pudieron cargar los documentos.</p></div>
            )}

            {!docsLoadFailed && previewDocs.length === 0 && (
              <div className="blueprint-preview-empty"><p>Aún no has generado documentación. Ve a Docify para crear una.</p></div>
            )}

            {previewDocs.map((doc) => (
              <div className="doc-item" key={doc.id}>
                <div className="doc-icon-box"><FileText size={14} /></div>
                <div className="doc-details">
                  <span className="doc-name">{doc.name}</span>
                  <span className="doc-time">{docTimeLabel(doc)}</span>
                </div>
              </div>
            ))}

            {extraDocCount > 0 && (
              <div className="list-more-badge">+{extraDocCount} more</div>
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
            {insightLoadFailed && (
              <p className="insight-text">No se pudo cargar el último insight de IA.</p>
            )}

            {!insightLoadFailed && !latestInsight && (
              <p className="insight-text">Aún no hay insights guardados. Analiza un archivo en DeepLint para verlo aquí.</p>
            )}

            {latestInsight && (
              <p className="insight-text">
                DeepLint analizó <strong>{latestInsight.fileName}</strong> ({latestInsight.repoUrl.replace('https://github.com/', '')}) · {timeAgo(latestInsight.createdAt)}
              </p>
            )}

            <div className="insights-actions">
              <button className="btn-insight-apply" onClick={onNavigateToDeepLint}>Ver en DeepLint</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
