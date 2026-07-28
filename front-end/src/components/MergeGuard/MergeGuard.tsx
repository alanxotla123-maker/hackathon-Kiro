import React, { useState } from 'react';
import { Share2, Download, ChevronDown, Loader2 } from 'lucide-react';
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

  /** Extract "owner/repo" from various URL formats */
  const extractRepoPath = (input: string): string => {
    let cleaned = input.trim().replace(/\.git$/, '').replace(/\/$/, '');
    if (cleaned.includes('github.com/')) {
      cleaned = cleaned.split('github.com/')[1];
    }
    return cleaned;
  };

  const analyzeRepo = async () => {
    if (!repoUrl) return;
    setIsAnalyzing(true);
    try {
      const repoPath = extractRepoPath(repoUrl);

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
            onClick={analyzeRepo}
            disabled={isAnalyzing}
            className="analyze-btn"
          >
            {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <ChevronDown size={14} />}
          </button>
        </div>
      </header>

      {/* ── UNIFIED GRID FOOTER ── */}
      <div className="dashboard-footer">
        
        {/* Left Column */}
        <div className="footer-col-left">
          {/* Share Growth */}
          <div className="glass-card">
            <div className="card-title">
              <span>Share Growth</span>
              <Share2 size={14} />
            </div>
            <button className="action-button">Post to X</button>
            <button className="action-button"><Download size={14} /> Export SVG</button>
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
