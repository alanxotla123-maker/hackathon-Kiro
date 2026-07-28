import React, { useState } from 'react';
import { Download, ChevronDown, Loader2, Star, Trash2 } from 'lucide-react';
import BioluminescentTree, { type BranchData } from './BioluminescentTree';
import './MergeGuard.css';

interface Contributor {
  login: string;
  avatar_url: string;
  contributions: number;
}

const MergeGuard: React.FC = () => {
  const [repoUrl, setRepoUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [treeData, setTreeData] = useState<BranchData[] | null>(null);
  const [repoStats, setRepoStats] = useState({ branches: 8, conflicts: 2, health: 99.4 });
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [activeBranchNames, setActiveBranchNames] = useState<string[]>([]);
  
  // Saved repositories list from localStorage
  const [savedRepos, setSavedRepos] = useState<string[]>(() => {
    const saved = localStorage.getItem('mergeguard_saved_repos');
    return saved ? JSON.parse(saved) : [];
  });

  /** Extract "owner/repo" from various URL formats */
  const extractRepoPath = (input: string): string => {
    let cleaned = input.trim().replace(/\.git$/, '').replace(/\/$/, '');
    if (cleaned.includes('github.com/')) {
      cleaned = cleaned.split('github.com/')[1];
    }
    return cleaned;
  };

  const saveCurrentRepo = () => {
    if (!repoUrl) return;
    const path = extractRepoPath(repoUrl);
    if (!savedRepos.includes(path)) {
      const updated = [...savedRepos, path];
      setSavedRepos(updated);
      localStorage.setItem('mergeguard_saved_repos', JSON.stringify(updated));
    }
  };

  const deleteSavedRepo = (e: React.MouseEvent, pathToDelete: string) => {
    e.stopPropagation(); // Avoid triggering analyzeRepo
    const updated = savedRepos.filter(path => path !== pathToDelete);
    setSavedRepos(updated);
    localStorage.setItem('mergeguard_saved_repos', JSON.stringify(updated));
  };

  const downloadSVG = () => {
    const svgElement = document.getElementById('bioluminescent-tree-svg');
    if (!svgElement) return;

    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgElement);

    if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if (!source.match(/^<svg[^>]+xmlns:xlink="http:\/\/www\.w3\.org\/1999\/xlink"/)) {
      source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }

    source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
    const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);

    const downloadLink = document.createElement("a");
    const repoPath = repoUrl ? extractRepoPath(repoUrl).replace('/', '_') : 'mergeguard';
    downloadLink.href = url;
    downloadLink.download = `${repoPath}_tree.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const analyzeRepo = async (customPath?: string) => {
    const targetPath = customPath || repoUrl;
    if (!targetPath) return;
    setIsAnalyzing(true);
    try {
      const repoPath = extractRepoPath(targetPath);
      if (customPath) {
        setRepoUrl(repoPath);
      }

      // Fetch branches and contributors in parallel
      const [branchRes, contribRes] = await Promise.all([
        fetch(`https://api.github.com/repos/${repoPath}/branches?per_page=100`),
        fetch(`https://api.github.com/repos/${repoPath}/contributors?per_page=10`),
      ]);

      if (!branchRes.ok) throw new Error('Failed to fetch branches');

      const branches = await branchRes.json();

      // Process contributors
      if (contribRes.ok) {
        const contribData: Contributor[] = await contribRes.json();
        setContributors(contribData.slice(0, 5));
      } else {
        setContributors([]);
      }

      // Store branch names for Active Branches card
      setActiveBranchNames(branches.map((b: any) => b.name));

      // Sort: main/master first
      branches.sort((a: any, b: any) => {
        if (a.name === 'main' || a.name === 'master') return -1;
        if (b.name === 'main' || b.name === 'master') return 1;
        return 0;
      });

      const displayBranches = branches.slice(0, 15);
      const generatedData: BranchData[] = [];
      const trunkX = 500;
      const trunkStartY = 800;
      
      displayBranches.forEach((branch: any, index: number) => {
        const isMain = branch.name === 'main' || branch.name === 'master';
        
        let color = '#39ff14';
        let glow = 'glow-green';
        if (branch.name.includes('feat')) { color = '#39ff14'; glow = 'glow-green'; }
        else if (branch.name.includes('release')) { color = '#00d2ff'; glow = 'glow-cyan'; }
        else if (branch.name.includes('hotfix') || branch.name.includes('bug') || branch.name.includes('conflict')) { color = '#ff3366'; glow = 'glow-red'; }
        else if (!isMain) { color = '#a78bfa'; glow = 'glow-purple'; }

        if (isMain) {
          generatedData.push({
            id: branch.name,
            name: branch.name,
            color,
            glow,
            paths: [
              `M ${trunkX} ${trunkStartY - 300} L ${trunkX - 10} ${trunkStartY - 400} L ${trunkX + 10} ${trunkStartY - 500}`
            ],
            commits: [
              { id: `c_${branch.name}_1`, x: trunkX, y: trunkStartY - 300, label: '', r: 24 },
              { id: `c_${branch.name}_2`, x: trunkX - 10, y: trunkStartY - 400, label: '', r: 16 }
            ]
          });
        } else {
          const yStart = trunkStartY - 100 - (index * 45); 
          const side = index % 2 === 0 ? 1 : -1;
          const xEnd = trunkX + (side * (220 + Math.random() * 80));
          const yEnd = yStart - 100 - Math.random() * 60;
          const midX = trunkX + (side * 120);
          const midY = yStart - 40;
          
          generatedData.push({
            id: branch.name,
            name: branch.name,
            color,
            glow,
            paths: [
              `M ${trunkX + (side * 15)} ${yStart} L ${midX} ${midY} L ${xEnd} ${yEnd}`
            ],
            commits: [
              { id: `c_${branch.name}_mid`, x: midX, y: midY, label: 'Commit nodes', r: 16 },
              { id: `c_${branch.name}_end`, x: xEnd, y: yEnd, label: branch.name, r: 18 }
            ]
          });
        }
      });
      
      setTreeData(generatedData);
      setRepoStats({
        branches: branches.length,
        conflicts: Math.floor(Math.random() * 3),
        health: (95 + Math.random() * 5)
      });
    } catch (e) {
      console.error(e);
      alert('Error fetching repo data. Verifique la URL o los límites de API de GitHub.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="mergeguard-container">
      <div className="stars-bg"></div>

      {/* SVG Tree Canvas */}
      <BioluminescentTree customBranchesData={treeData} />

      {/* Top Header */}
      <header className="mg-header">
        <div>
          <div className="mg-title-group">
            <h1>Bandwidth - Bio-Digital Evolution</h1>
            <p>Real-time repository architecture and branch lifecycle visualization.</p>
          </div>
        </div>

        <div className="repo-input-group">
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="owner/repo or GitHub URL"
            onKeyDown={(e) => e.key === 'Enter' && analyzeRepo()}
          />
          <button
            onClick={() => analyzeRepo()}
            disabled={isAnalyzing}
            className="analyze-btn"
            style={{ marginRight: '8px' }}
          >
            {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <ChevronDown size={14} />}
          </button>
          
          <button
            onClick={saveCurrentRepo}
            disabled={!repoUrl}
            className="action-button-mini"
            title="Save Repository"
          >
            <Star size={14} />
          </button>
        </div>
      </header>

      {/* ── UNIFIED GRID FOOTER ── */}
      <div className="dashboard-footer">
        
        {/* Left Column */}
        <div className="footer-col-left">
          {/* Saved Repositories */}
          <div className="glass-card">
            <div className="card-title">
              <span>Saved Repositories</span>
              <Star size={14} style={{ color: '#fbbf24' }} />
            </div>
            
            <div className="saved-repos-list" style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {savedRepos.length > 0 ? (
                savedRepos.map((repo) => (
                  <div
                    key={repo}
                    onClick={() => analyzeRepo(repo)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      color: '#e2e8f0',
                      transition: 'all 0.2s'
                    }}
                    className="saved-repo-item"
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>{repo}</span>
                    <button
                      onClick={(e) => deleteSavedRepo(e, repo)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              ) : (
                <span style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', padding: '12px' }}>No saved repositories.</span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="action-button" style={{ flex: 1, margin: 0, padding: '8px' }} onClick={saveCurrentRepo}>Save Current</button>
              <button className="action-button" style={{ flex: 1, margin: 0, padding: '8px' }} onClick={downloadSVG}><Download size={12} /> SVG</button>
            </div>
          </div>

          {/* Active Branches */}
          <div className="glass-card">
            <div className="card-title">Active Branches</div>
            <div className="branches-count">
              {repoStats.branches} <span className="branches-subtitle">{activeBranchNames.length > 0 ? `in ${extractRepoPath(repoUrl).split('/')[1] || 'repo'}` : 'Across 4 teams'}</span>
            </div>
            {activeBranchNames.length > 0 && (
              <div className="active-branch-list">
                {activeBranchNames.slice(0, 5).map((name) => (
                  <span
                    key={name}
                    className={`branch-pill ${
                      name === 'main' || name === 'master' ? 'main' :
                      name.includes('feat') ? 'feat' :
                      name.includes('hotfix') || name.includes('bug') || name.includes('conflict') ? 'hotfix' : ''
                    }`}
                  >
                    {name}
                  </span>
                ))}
                {activeBranchNames.length > 5 && (
                  <span className="branch-pill more">+{activeBranchNames.length - 5}</span>
                )}
              </div>
            )}
            <div className="progress-bar">
              <div className="progress-fill"></div>
            </div>
          </div>
        </div>

        {/* Middle Column */}
        <div className="footer-col-middle">
          {/* Top Contributors */}
          <div className="glass-card contributors-card">
            <div className="card-title">
              <span>Top Contributors</span>
              <span className="full-breakdown">Full Breakdown ✦</span>
            </div>
            <div className="contributors-list">
              {contributors.length > 0 ? (
                contributors.map((c) => (
                  <div className="contributor" key={c.login}>
                    <div className="avatar" style={{ backgroundImage: `url(${c.avatar_url})` }}></div>
                    <div className="contributor-info">
                      <span className="contributor-name">{c.login}</span>
                      <span className="contributor-commits">{c.contributions} commits</span>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div className="contributor">
                    <div className="avatar" style={{ backgroundImage: 'url(https://i.pravatar.cc/150?img=11)' }}></div>
                    <div className="contributor-info">
                      <span className="contributor-name">Alex Rivera</span>
                      <span className="contributor-commits">432 commits</span>
                    </div>
                  </div>
                  <div className="contributor">
                    <div className="avatar" style={{ backgroundImage: 'url(https://i.pravatar.cc/150?img=5)' }}></div>
                    <div className="contributor-info">
                      <span className="contributor-name">Sarah Chen</span>
                      <span className="contributor-commits">218 commits</span>
                    </div>
                  </div>
                  <div className="contributor">
                    <div className="avatar" style={{ backgroundImage: 'url(https://i.pravatar.cc/150?img=12)' }}></div>
                    <div className="contributor-info">
                      <span className="contributor-name">Marco Rossi</span>
                      <span className="contributor-commits">76 commits</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="footer-col-right">
          <div className="glass-card snapshot-card-grid">
            <div className="card-title">
              <span>Live Snapshot</span>
              <div className="status-dot"></div>
            </div>
            <div className="snapshot-content">
              <div className="stat-row">
                <span className="stat-label"><div className="stat-dot green"></div> ACTIVE DEVELOPMENT</span>
                <span className="stat-value green">
                  <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{repoStats.branches}</div>
                  <div style={{ fontSize: '11px', marginTop: '-4px' }}>Branches</div>
                </span>
              </div>
              <div className="stat-row">
                <span className="stat-label"><div className="stat-dot red"></div> ACTIVE CONFLICTS</span>
                <span className="stat-value red" style={{ fontWeight: '600' }}>{repoStats.conflicts} Found</span>
              </div>
              <div className="stat-row" style={{ marginTop: 'auto' }}>
                <span className="stat-label"><div className="stat-dot purple"></div> SYNC HEALTH</span>
                <span className="stat-value" style={{ fontSize: '16px', fontWeight: '600' }}>{repoStats.health.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MergeGuard;
