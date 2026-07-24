import React from 'react';
import { Share2, Download, Activity, Loader2, GitBranch, ArrowLeft, FileText, Search, AlertTriangle, Shield } from 'lucide-react';
import BioluminescentTree, { type BranchData } from './BioluminescentTree.tsx';
import './MergeGuard.css';

// ══════════════════════════════════════════════════════════════════
// MergeGuard Sidebar (follows BandwidthSidebar / DeepLintSidebar pattern)
// ══════════════════════════════════════════════════════════════════
export function MergeGuardSidebar({
  repoUrl,
  setRepoUrl,
  onAnalyze,
  isAnalyzing,
  repoStats,
  onNavigateHome,
}: {
  repoUrl: string
  setRepoUrl: (url: string) => void
  onAnalyze: () => void
  isAnalyzing: boolean
  repoStats: { branches: number; conflicts: number; health: number }
  onNavigateHome: () => void
}) {
  return (
    <div className="left-sidebar" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'transparent', borderRight: 'none' }}>

      {/* Header — back arrow + title */}
      <div className="master-sidebar-logo-group" style={{ cursor: 'pointer', borderBottom: '1px solid #131924' }} onClick={onNavigateHome}>
        <ArrowLeft size={16} style={{ color: '#94a3b8', marginRight: '8px' }} />
        <div className="master-logo-text-group">
          <span className="master-logo-text" style={{ fontSize: '13px' }}>MergeGuard</span>
          <span className="master-logo-sub">branch visualization</span>
        </div>
      </div>

      <div className="sidebar-top" style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>

        {/* Explorer card */}
        <div className="explorer-card" style={{ marginBottom: '4px' }}>
          <div className="explorer-icon-wrapper" style={{ background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80' }}>
            <Shield size={16} />
          </div>
          <div className="explorer-info">
            <h3>Branch Guard</h3>
            <p>Neural map &amp; conflict detection</p>
          </div>
        </div>

        {/* Repository input */}
        <div className="deeplint-sidebar-repo-section">
          <span className="sidebar-list-title">Analyze Repository</span>
          <div className="deeplint-sidebar-repo-input-row">
            <input
              className="deeplint-sidebar-repo-input"
              type="text"
              placeholder="github.com/owner/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') onAnalyze() }}
            />
            <button
              className="deeplint-sidebar-analyze-btn"
              onClick={onAnalyze}
              disabled={isAnalyzing || !repoUrl.trim()}
              title="Analyze"
            >
              {isAnalyzing ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
            </button>
          </div>
        </div>

        {/* Live Stats */}
        <div className="sidebar-menu" style={{ padding: 0, marginTop: '12px' }}>
          <div className="menu-item active">
            <Activity size={14} />
            LIVE SNAPSHOT
          </div>
        </div>

        <div className="sidebar-content-area">
          <div className="sidebar-list-item" style={{ cursor: 'default' }}>
            <span className="sidebar-item-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#4ade80', fontSize: '12px' }}>●</span>
              Active Branches
            </span>
            <span className="sidebar-item-meta" style={{ color: '#4ade80', fontWeight: 600 }}>{repoStats.branches}</span>
          </div>
          <div className="sidebar-list-item" style={{ cursor: 'default' }}>
            <span className="sidebar-item-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#f87171', fontSize: '12px' }}>●</span>
              Active Conflicts
            </span>
            <span className="sidebar-item-meta" style={{ color: repoStats.conflicts > 0 ? '#f87171' : '#4ade80', fontWeight: 600 }}>{repoStats.conflicts}</span>
          </div>
          <div className="sidebar-list-item" style={{ cursor: 'default' }}>
            <span className="sidebar-item-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#c084fc', fontSize: '12px' }}>●</span>
              Sync Health
            </span>
            <span className="sidebar-item-meta" style={{ color: '#c084fc', fontWeight: 600 }}>{repoStats.health.toFixed(1)}%</span>
          </div>
        </div>

        {/* Conflict warning */}
        {repoStats.conflicts > 0 && (
          <div className="sidebar-content-area" style={{ border: '1px solid rgba(248, 113, 113, 0.2)', background: 'rgba(248, 113, 113, 0.05)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span className="sidebar-list-title" style={{ color: '#f87171', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={12} />
                CONFLICTS DETECTED
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{repoStats.conflicts} branch conflict(s) require attention</span>
            </div>
          </div>
        )}

        {/* Contributors */}
        <div className="sidebar-menu" style={{ padding: 0, marginTop: '12px' }}>
          <div className="menu-item">
            <GitBranch size={14} />
            TOP CONTRIBUTORS
          </div>
        </div>

        <div className="sidebar-content-area">
          <div className="sidebar-list-item" style={{ cursor: 'default' }}>
            <span className="sidebar-item-name" style={{ fontSize: '11px' }}>Alex Rivera</span>
            <span className="sidebar-item-meta">128</span>
          </div>
          <div className="sidebar-list-item" style={{ cursor: 'default' }}>
            <span className="sidebar-item-name" style={{ fontSize: '11px' }}>Sarah Chen</span>
            <span className="sidebar-item-meta">94</span>
          </div>
          <div className="sidebar-list-item" style={{ cursor: 'default' }}>
            <span className="sidebar-item-name" style={{ fontSize: '11px' }}>Marco Rossi</span>
            <span className="sidebar-item-meta">76</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="master-sidebar-footer" style={{ borderTop: '1px solid #131924' }}>
        <div className="master-footer-item">
          <FileText size={13} /><span>DOCS</span>
        </div>
        <div className="master-footer-item">
          <Activity size={13} /><span>STATUS</span>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// MergeGuard Main Component
// ══════════════════════════════════════════════════════════════════
interface MergeGuardProps {
  repoUrl: string
  setRepoUrl: (url: string) => void
  isAnalyzing: boolean
  treeData: BranchData[] | null
  repoStats: { branches: number; conflicts: number; health: number }
  onAnalyze: () => void
}

const MergeGuard: React.FC<MergeGuardProps> = ({ repoUrl: _repoUrl, setRepoUrl: _setRepoUrl, isAnalyzing: _isAnalyzing, treeData, repoStats, onAnalyze: _onAnalyze }) => {

  return (
    <div className="mergeguard-container">
      {/* Background SVG filters */}
      <svg width="0" height="0">
        <defs>
          <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur1" />
            <feGaussianBlur stdDeviation="12" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur1" />
            <feGaussianBlur stdDeviation="8" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-purple" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur1" />
            <feGaussianBlur stdDeviation="10" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* Top Left Actions */}
      <div className="top-left-actions">
        <div className="glass-pill">
          <Activity size={14} color="#a78bfa" />
          Bioluminescent Neural Map
        </div>
        <div className="glass-pill">
          <Activity size={14} color="#8a9cb0" />
          Interact with glowing nodes
        </div>
      </div>

      {/* SVG Tree Canvas */}
      <BioluminescentTree customBranchesData={treeData} />

      {/* Share Card */}
      <div className="glass-card share-card">
        <div className="share-header">
          SHARE GROWTH
          <Share2 size={14} />
        </div>
        <button className="action-button">
          <Activity size={16} /> Post to X
        </button>
        <button className="action-button">
          <Download size={16} /> Export SVG
        </button>
      </div>

      {/* Snapshot Card */}
      <div className="glass-card snapshot-card">
        <div className="snapshot-header">
          LIVE SNAPSHOT
          <div className="status-dot"></div>
        </div>
        <div className="stat-row">
          <div className="stat-label">
            <div className="stat-dot green"></div>
            Active Development
          </div>
          <div className="stat-value green">{repoStats.branches} Branches</div>
        </div>
        <div className="stat-row">
          <div className="stat-label">
            <div className="stat-dot red"></div>
            Active Conflicts
          </div>
          <div className="stat-value red">{repoStats.conflicts} Found</div>
        </div>
        <div className="stat-row">
          <div className="stat-label">
            <div className="stat-dot purple"></div>
            Sync Health
          </div>
          <div className="stat-value">{repoStats.health.toFixed(1)}%</div>
        </div>
      </div>

      {/* Bottom Panels */}
      <div className="bottom-panels">
        {/* Active Branches */}
        <div className="glass-card active-branches-card">
          <div className="share-header" style={{ marginBottom: '8px' }}>ACTIVE BRANCHES</div>
          <div className="branches-count">
            {repoStats.branches} <span className="branches-subtitle">Across detected teams</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill"></div>
          </div>
        </div>

        {/* Top Contributors */}
        <div className="glass-card contributors-card">
          <div className="contributors-header">
            Top Contributors
            <span className="full-breakdown">Full Breakdown</span>
          </div>
          <div className="contributors-list">
            <div className="contributor">
              <div className="avatar" style={{ backgroundImage: 'url(https://i.pravatar.cc/150?u=a042581f4e29026704d)' }}></div>
              <div className="contributor-info">
                <span className="contributor-name">Alex Rivera</span>
                <span className="contributor-commits">128</span>
              </div>
            </div>
            <div className="contributor">
              <div className="avatar" style={{ backgroundImage: 'url(https://i.pravatar.cc/150?u=a042581f4e29026703d)' }}></div>
              <div className="contributor-info">
                <span className="contributor-name">Sarah Chen</span>
                <span className="contributor-commits">94</span>
              </div>
            </div>
            <div className="contributor">
              <div className="avatar" style={{ backgroundImage: 'url(https://i.pravatar.cc/150?u=a042581f4e29026702d)' }}></div>
              <div className="contributor-info">
                <span className="contributor-name">Marco Rossi</span>
                <span className="contributor-commits">76</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MergeGuard;
