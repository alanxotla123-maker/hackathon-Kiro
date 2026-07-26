import React from 'react';
import { Share2, Download, ChevronDown, Sparkles } from 'lucide-react';
import './BranchTree.css';

const BranchTree: React.FC = () => {
  return (
    <div className="bio-tree-container">
      {/* ── Background Elements ── */}
      <div className="stars-bg"></div>

      {/* ── Glowing SVG Tree ── */}
      <svg className="bio-tree-svg-canvas" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-blue" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Base Foundation (Roots) */}
        <path d="M500,800 L550,700 L600,800 M700,800 L650,700 L600,800" className="branch-path branch-trunk" opacity="0.4" />
        <path d="M400,800 L550,650 M800,800 L650,650" className="branch-path branch-trunk" opacity="0.2" />

        {/* Main Trunk */}
        <path d="M600,800 C600,600 600,500 600,300" className="branch-path branch-trunk" filter="url(#glow-green)" />
        <path d="M570,800 C580,600 580,500 600,300" className="branch-path branch-trunk" filter="url(#glow-green)" opacity="0.6"/>
        <path d="M630,800 C620,600 620,500 600,300" className="branch-path branch-trunk" filter="url(#glow-green)" opacity="0.6"/>

        {/* Feat Branches (Left - Green) */}
        <path d="M600,450 C450,450 300,350 200,200" className="branch-path branch-feat" filter="url(#glow-green)" />
        <path d="M600,350 C500,350 400,250 150,350" className="branch-path branch-feat" filter="url(#glow-green)" />
        <path d="M400,380 C350,300 250,250 200,450" className="branch-path branch-feat" filter="url(#glow-green)" />

        {/* Release Branches (Right - Blue) */}
        <path d="M600,350 C750,350 850,250 950,200" className="branch-path branch-release" filter="url(#glow-blue)" />
        <path d="M850,285 C900,300 950,320 1000,350" className="branch-path branch-release" filter="url(#glow-blue)" />

        {/* Hotfix Branches (Right - Red) */}
        <path d="M600,450 C750,450 800,400 950,400" className="branch-path branch-hotfix" filter="url(#glow-red)" />
        <path d="M800,430 C850,480 900,500 950,500" className="branch-path branch-hotfix" filter="url(#glow-red)" />

        {/* Commits (Nodes) */}
        <circle cx="600" cy="550" r="8" className="commit-node feat" filter="url(#glow-green)"/>
        <circle cx="600" cy="450" r="12" className="commit-node feat" filter="url(#glow-green)"/>
        <circle cx="600" cy="350" r="14" className="commit-node feat" filter="url(#glow-green)"/>
        
        {/* Polyhedrons (Simplified as polygons) */}
        <polygon points="600,650 620,680 600,720 580,680" fill="none" stroke="#39ff14" strokeWidth="2" filter="url(#glow-green)" />
        <polygon points="600,500 625,520 600,550 575,520" fill="rgba(57,255,20,0.2)" stroke="#39ff14" strokeWidth="2" filter="url(#glow-green)" />
        
        <circle cx="410" cy="360" r="6" className="commit-node feat" />
        <circle cx="280" cy="270" r="8" className="commit-node feat" filter="url(#glow-green)" />
        <circle cx="230" cy="380" r="6" className="commit-node feat" />
        
        <circle cx="780" cy="330" r="6" className="commit-node release" />
        <circle cx="950" cy="200" r="8" className="commit-node release" filter="url(#glow-blue)" />
        <circle cx="1000" cy="350" r="6" className="commit-node release" />

        <circle cx="730" cy="430" r="10" className="commit-node hotfix" filter="url(#glow-red)" />
        <circle cx="850" cy="470" r="6" className="commit-node hotfix" />
        <circle cx="950" cy="400" r="6" className="commit-node hotfix" />
      </svg>

      {/* ── UI Layer ── */}
      <div className="bio-ui-layer">
        
        {/* Header */}
        <header className="bio-header">
          <div className="bio-title">
            <h1>Bandwidth - Bio-Digital Evolution</h1>
            <p>Real-time repository architecture and branch lifecycle visualization.</p>
          </div>
          <div className="bio-dropdown">
            infrastructure-core-v2
            <ChevronDown size={14} />
          </div>
        </header>

        {/* Floating Labels (Positioned absolute over SVG coords roughly) */}
        <div className="floating-label label-trunk" style={{ top: '65%', left: '53%' }}>MAIN<br/>TRUNK</div>
        <div className="floating-label label-feat" style={{ top: '35%', left: '20%' }}>feat/bioluminescent-map</div>
        <div className="floating-label label-feat" style={{ top: '48%', left: '15%' }}>feat/bluminescent-1<br/><span style={{color: '#64748b', fontSize: '9px'}}>Commit nodes</span></div>
        <div className="floating-label label-release" style={{ top: '30%', left: '78%' }}>release/v2.1</div>
        <div className="floating-label label-hotfix" style={{ top: '42%', left: '80%' }}>hotfix/conflict-resolution<br/><span style={{color: '#64748b', fontSize: '9px'}}>Commit nodes</span></div>

        <div className="floating-label" style={{ top: '78%', left: '33%', color: '#64748b' }}>ca3f4g</div>
        <div className="floating-label" style={{ top: '75%', left: '42%', color: '#64748b' }}>6d2e1a</div>
        <div className="floating-label" style={{ top: '78%', left: '55%', color: '#64748b' }}>8b1d8c</div>
        <div className="floating-label" style={{ top: '82%', left: '45%', color: '#8c9bb0' }}>Project Foundation (Commits)</div>

        {/* Floating Tags */}
        <div className="floating-tag tag-top-left">
          <Sparkles size={14} color="#39ff14" />
          Bioluminescent Neural Map
        </div>
        <div className="floating-tag tag-top-right">
          Project Overview (Canopy)
        </div>

        {/* Share Growth Panel */}
        <div className="glass-panel share-panel">
          <div className="panel-title">
            SHARE GROWTH <Share2 size={12} />
          </div>
          <button className="share-btn">
             Post to X
          </button>
          <button className="share-btn">
            <Download size={14} /> Export SVG
          </button>
        </div>

        {/* Live Snapshot Panel */}
        <div className="glass-panel snapshot-panel">
          <div className="panel-title">
            LIVE SNAPSHOT
            <div className="stat-dot dot-green"></div>
          </div>
          
          <div className="stat-row">
            <div className="stat-label"><div className="stat-dot dot-green"></div> Active Development</div>
            <div className="stat-value stat-highlight-green">8 Branches</div>
          </div>
          
          <div className="stat-row">
            <div className="stat-label"><div className="stat-dot dot-red"></div> Active Conflicts</div>
            <div className="stat-value stat-highlight-red">2 Found</div>
          </div>
          
          <div className="stat-row">
            <div className="stat-label"><div className="stat-dot dot-blue"></div> Sync Health</div>
            <div className="stat-value stat-highlight-blue">99.4%</div>
          </div>
        </div>

        {/* Bottom Footer Grid */}
        <div className="bio-footer">
          <div className="glass-panel branches-panel">
            <div className="panel-title">ACTIVE BRANCHES</div>
            <div className="branches-count">12 <span>Across 4 teams</span></div>
            <div className="progress-bar">
              <div className="progress-fill"></div>
            </div>
          </div>

          <div className="glass-panel contributors-panel">
            <div className="panel-title">
              Top Contributors 
              <span style={{ textTransform: 'none', color: '#cbd5e1', cursor: 'pointer' }}>Full Breakdown ✦</span>
            </div>
            
            <div className="contributors-list">
              <div className="contributor">
                <div className="contributor-avatar">
                  <img src="https://i.pravatar.cc/100?img=11" alt="Alex Rivera" />
                  <div className="contributor-status"></div>
                </div>
                <div className="contributor-info">
                  <h4>Alex Rivera</h4>
                  <p>128</p>
                </div>
              </div>
              
              <div className="contributor">
                <div className="contributor-avatar">
                  <img src="https://i.pravatar.cc/100?img=5" alt="Sarah Chen" />
                  <div className="contributor-status"></div>
                </div>
                <div className="contributor-info">
                  <h4>Sarah Chen</h4>
                  <p>94</p>
                </div>
              </div>
              
              <div className="contributor">
                <div className="contributor-avatar">
                  <img src="https://i.pravatar.cc/100?img=12" alt="Marco Rossi" />
                  <div className="contributor-status"></div>
                </div>
                <div className="contributor-info">
                  <h4>Marco Rossi</h4>
                  <p>76</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BranchTree;
