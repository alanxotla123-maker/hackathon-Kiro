import React, { useState, useMemo } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import './MergeGuard.css';

export interface BranchData {
  id: string;
  name: string;
  color?: string;
  glow?: string;
  paths?: string[];
  commits?: { id: string; x: number; y: number; label: string; r?: number }[];
}

interface BioluminescentTreeProps {
  customBranchesData?: BranchData[] | null;
}

const BioluminescentTree: React.FC<BioluminescentTreeProps> = ({ customBranchesData }) => {
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<any>(null);

  // Generate highly performant Yggdrasil tree paths with extreme realism
  const treeVisuals = useMemo(() => {
    const defaultBranches = [
      { name: 'main' },
      { name: 'feat/bioluminescent-map' },
      { name: 'feat/bluminescent-1' },
      { name: 'feat/biolouiloper-oranogn' },
      { name: 'release/v2.1' },
      { name: 'hotfix/conflict-resolution' },
      { name: 'conflict #1' },
      { name: 'conflict #2' },
    ];

    const branches = (customBranchesData && customBranchesData.length > 0) ? customBranchesData : defaultBranches;

    const paths: { d: string; width: number; opacity: number; color: string; isData?: boolean; dash?: string; branchName?: string }[] = [];
    const labels: { x: number; y: number; text: string; color: string; isNode: boolean; branchData?: any }[] = [];

    // Performance optimization: Compile thousands of leaves into a handful of paths grouped by speed/color
    const leafGroups: Record<string, { slow: string; med: string; fast: string }> = {};

    let seed = 999;
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    // Recursive function for natural twigs and cyber-foliage
    const spawnTwigs = (x: number, y: number, angle: number, length: number, width: number, depth: number, color: string, branchName: string) => {
      if (depth === 0 || width < 0.5) return;

      const numBranches = random() > 0.2 ? 2 : 1;

      for (let i = 0; i < numBranches; i++) {
        const bend = (random() - 0.5) * 1.2;
        const newAngle = angle + bend;
        const newLength = length * (0.6 + random() * 0.4);

        const endX = x + Math.cos(newAngle) * newLength;
        const endY = y + Math.sin(newAngle) * newLength;

        const cpX = x + Math.cos(angle) * newLength * 0.5;
        const cpY = y + Math.sin(angle) * newLength * 0.5;

        const d = `M ${x} ${y} Q ${cpX} ${cpY} ${endX} ${endY}`;

        paths.push({ d, width: width * 1.5, opacity: 0.15, color, branchName }); // ambient glow
        paths.push({ d, width: Math.max(0.5, width * 0.8), opacity: 0.6 + (width * 0.05), color, branchName }); // core

        if (random() > 0.7) {
          paths.push({ d, width: 0.8, opacity: 0.9, color: '#ffffff', isData: true, dash: '2 20', branchName });
        }

        // High-Performance Leaf Generation
        if (depth === 1 || depth === 2) {
          if (!leafGroups[color]) leafGroups[color] = { slow: '', med: '', fast: '' };

          const numLeaves = depth === 1 ? 12 : 4;
          for (let k = 0; k < numLeaves; k++) {
            const lx = endX + (random() - 0.5) * 60;
            const ly = endY + (random() - 0.5) * 60;
            // A tiny line with round linecap renders as a perfect dot in SVG, allowing 1000s of dots in 1 path!
            const leafD = `M ${lx} ${ly} l 0.01 0 `;

            const speed = random();
            if (speed < 0.33) leafGroups[color].slow += leafD;
            else if (speed < 0.66) leafGroups[color].med += leafD;
            else leafGroups[color].fast += leafD;
          }
        }

        spawnTwigs(endX, endY, newAngle, newLength, width * 0.65, depth - 1, color, branchName);
      }
    };

    const trunkBottomY = 950;
    const trunkTopY = 650;
    const trunkX = 500;

    // 2. Trunk Strands (Realistic Braided Bark)
    const trunkStrands = 16;
    const trunkPositions = Array.from({ length: trunkStrands }, () => {
      const baseSpread = (random() - 0.5) * 110;
      return { x: trunkX + baseSpread, y: trunkBottomY };
    });

    // Massive ambient glows replace the need for 50+ strands
    paths.push({ d: `M ${trunkX} ${trunkBottomY} Q ${trunkX} ${(trunkBottomY + trunkTopY) / 2} ${trunkX} ${trunkTopY}`, width: 55, opacity: 0.1, color: '#39ff14', branchName: 'main' });
    paths.push({ d: `M ${trunkX} ${trunkBottomY} Q ${trunkX} ${(trunkBottomY + trunkTopY) / 2} ${trunkX} ${trunkTopY}`, width: 28, opacity: 0.25, color: '#39ff14', branchName: 'main' });
    paths.push({ d: `M ${trunkX} ${trunkBottomY} Q ${trunkX} ${(trunkBottomY + trunkTopY) / 2} ${trunkX} ${trunkTopY}`, width: 8, opacity: 0.8, color: '#39ff14', branchName: 'main' }); // solid core

    trunkPositions.forEach((pos, _idx) => {
      let d = `M ${pos.x} ${trunkBottomY}`;
      let currentX = pos.x;
      let currentY = trunkBottomY;

      const numSteps = 5;
      const stepY = (trunkBottomY - trunkTopY) / numSteps;
      const phase = random() * Math.PI * 2;
      const frequency = 1.5;

      for (let i = 1; i <= numSteps; i++) {
        const nextY = trunkBottomY - i * stepY;
        const progress = i / numSteps;

        // Core center of the trunk at this height
        const centerX = pos.x * (1 - progress) + trunkX * progress;

        // Mathematical twist to intertwine the bark
        const twist = Math.sin(phase + i * frequency) * (25 * (1 - progress));
        const nextX = centerX + twist + (random() - 0.5) * 8;

        const cpX = currentX + (nextX - currentX) * 0.5 + (random() - 0.5) * 15;
        const cpY = currentY - stepY * 0.5;

        d += ` Q ${cpX} ${cpY} ${nextX} ${nextY}`;

        currentX = nextX;
        currentY = nextY;
      }

      paths.push({ d, width: random() > 0.5 ? 2.5 : 1.5, opacity: 0.35 + random() * 0.5, color: '#39ff14', branchName: 'main' });
      if (random() > 0.7) paths.push({ d, width: 1.5, opacity: 1, color: '#ffffff', isData: true, dash: '4 35', branchName: 'main' });
    });

    // 3. Draw Data Branches
    const sortedBranches = [...branches].sort((a, b) => {
      if (a.name === 'main' || a.name === 'master') return -1;
      if (b.name === 'main' || b.name === 'master') return 1;
      return 0;
    });

    const totalBranches = sortedBranches.length;

    sortedBranches.forEach((branch, idx) => {
      const isMain = branch.name === 'main' || branch.name === 'master';

      let branchColor = '#39ff14';
      if (branch.name.includes('release')) branchColor = '#00d2ff';
      else if (branch.name.includes('hotfix') || branch.name.includes('conflict') || branch.name.includes('bug')) branchColor = '#ff3366';
      else if (!isMain && !branch.name.includes('feat')) branchColor = '#a78bfa';

      let targetAngle = -Math.PI / 2;
      if (!isMain) {
        const fraction = totalBranches > 1 ? (idx / (totalBranches - 1)) : 0.5;
        let spread = -1.4 + (fraction * 2.8);
        if (Math.abs(spread) < 0.3) spread = spread < 0 ? -0.4 : 0.4;
        targetAngle = (-Math.PI / 2) + spread;
      }

      let currentWidth = isMain ? 20 : 12;
      const numSegments = isMain ? 5 : 4 + Math.floor(random() * 2);
      let segmentLength = isMain ? 115 : 95;

      const numStrands = isMain ? 6 : 4; // Optimized branch bundling

      // REALISM: Sprout branches at varying heights ALONG the trunk
      let glowX = trunkX + (random() - 0.5) * 10;
      let glowY = isMain ? trunkTopY : trunkTopY + 40 + (random() * 120);
      let dGlow = `M ${glowX} ${glowY}`;

      const strandPaths = Array.from({ length: numStrands }, () => {
        const sx = trunkX + (random() - 0.5) * 20;
        const sy = glowY + (random() - 0.5) * 20;
        return { d: `M ${sx} ${sy}`, x: sx, y: sy };
      });

      let currentAngle = -Math.PI / 2;

      for (let s = 0; s < numSegments; s++) {
        currentAngle += (targetAngle - currentAngle) * 0.45;
        currentAngle += (random() - 0.5) * 0.15; // Natural wander

        const nextX = glowX + Math.cos(currentAngle) * segmentLength;
        const nextY = glowY + Math.sin(currentAngle) * segmentLength;

        const cpGlowX = glowX + Math.cos(currentAngle) * segmentLength * 0.6;
        const cpGlowY = glowY + Math.sin(currentAngle) * segmentLength * 0.6;

        dGlow += ` Q ${cpGlowX} ${cpGlowY} ${nextX} ${nextY}`;

        strandPaths.forEach((strand, i) => {
          // Braiding physics: strands twist around the central branch path
          const twist = Math.sin(s * 1.5 + i) * currentWidth * 0.9;
          const targetNx = nextX + Math.cos(currentAngle + Math.PI / 2) * twist;
          const targetNy = nextY + Math.sin(currentAngle + Math.PI / 2) * twist;

          const cpTwist = Math.sin((s - 0.5) * 1.5 + i) * currentWidth * 1.2;
          const cpX = strand.x + Math.cos(currentAngle) * segmentLength * 0.6 + Math.cos(currentAngle + Math.PI / 2) * cpTwist;
          const cpY = strand.y + Math.sin(currentAngle) * segmentLength * 0.6 + Math.sin(currentAngle + Math.PI / 2) * cpTwist;

          strand.d += ` Q ${cpX} ${cpY} ${targetNx} ${targetNy}`;
          strand.x = targetNx;
          strand.y = targetNy;
        });

        if (s > 1 && s < numSegments - 1 && random() > 0.5) {
          labels.push({ x: nextX, y: nextY, text: '', color: branchColor, isNode: true, branchData: branch });
        }

        if (s > 0) {
          const twigAngle = currentAngle + (random() > 0.5 ? 0.9 : -0.9);
          spawnTwigs(glowX, glowY, twigAngle, segmentLength * 0.8, currentWidth * 0.4, 3, branchColor, branch.name);
        }

        glowX = nextX;
        glowY = nextY;
        currentWidth *= 0.75;
        segmentLength *= 0.9;
      }

      paths.push({ d: dGlow, width: isMain ? 28 : 16, opacity: 0.1, color: branchColor, branchName: branch.name });
      paths.push({ d: dGlow, width: isMain ? 14 : 8, opacity: 0.25, color: branchColor, branchName: branch.name });

      strandPaths.forEach(strand => {
        paths.push({ d: strand.d, width: random() > 0.5 ? 2.5 : 1.5, opacity: 0.3 + random() * 0.6, color: branchColor, branchName: branch.name });
        if (random() > 0.7) paths.push({ d: strand.d, width: 1.5, opacity: 0.9, color: '#ffffff', isData: true, dash: '5 45', branchName: branch.name });
      });

      spawnTwigs(glowX, glowY, currentAngle, segmentLength * 1.5, currentWidth, 4, branchColor, branch.name);

      labels.push({
        x: glowX + Math.cos(currentAngle) * 20,
        y: glowY + Math.sin(currentAngle) * 20,
        text: branch.name,
        color: branchColor,
        isNode: true,
        branchData: branch
      });
    });

    return { paths, labels, leafGroups };
  }, [customBranchesData]);

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    const zoomAmount = e.deltaY * -0.002;
    setTransform(prev => ({ ...prev, scale: Math.max(0.3, Math.min(4, prev.scale + zoomAmount)) }));
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    const svgRect = e.currentTarget.getBoundingClientRect();
    const scaleRatio = Math.min(svgRect.width / 1000, svgRect.height / 950) * transform.scale;
    setTransform(prev => ({ ...prev, x: prev.x + e.movementX / scaleRatio, y: prev.y + e.movementY / scaleRatio }));
  };

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', background: 'transparent' }}>

      <style>{`
        .yggdrasil-path {
          fill: none;
          stroke-linecap: round;
          stroke-linejoin: round;
          animation: pulse-energy 4s infinite alternate ease-in-out;
        }

        .data-pulse {
          fill: none;
          stroke-linecap: round;
          animation: data-flow 1.5s linear infinite;
        }

        .yggdrasil-label {
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 600;
          fill: #ffffff;
          letter-spacing: 0.5px;
        }

        .tech-node {
          transition: transform 0.2s;
        }
        .tech-node:hover {
          transform: scale(1.5);
        }
        
        .spin-node {
          animation: spin 6s linear infinite;
          transform-origin: center;
        }

        @keyframes pulse-energy {
          0% { opacity: 0.8; }
          100% { opacity: 1; }
        }

        @keyframes data-flow {
          to { stroke-dashoffset: -100; }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <svg
        id="bioluminescent-tree-svg"
        width="100%" height="100%"
        viewBox="0 0 1000 950"
        preserveAspectRatio="xMidYMid meet"
        style={{ pointerEvents: 'auto', cursor: isDragging ? 'grabbing' : 'grab' }}
        onWheel={handleWheel}
        onMouseDown={() => { setIsDragging(true); setSelectedBranch(null); }}
        onMouseMove={handleMouseMove}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
      >
        <defs>
          <radialGradient id="nebula-purple" cx="30%" cy="20%" r="50%">
            <stop offset="0%" stopColor="rgba(167, 139, 250, 0.25)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id="nebula-cyan" cx="70%" cy="30%" r="50%">
            <stop offset="0%" stopColor="rgba(0, 210, 255, 0.15)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#nebula-purple)" pointerEvents="none" />
        <rect width="100%" height="100%" fill="url(#nebula-cyan)" pointerEvents="none" />

        <g transform={`translate(${transform.x}, ${transform.y}) translate(500, 475) scale(${transform.scale}) translate(-500, -475)`}>

          {/* Holographic Base Emitter */}
          <ellipse cx={500} cy={950} rx={60} ry={12} fill="none" stroke="#39ff14" strokeWidth="2" opacity="0.4" style={{ filter: 'drop-shadow(0 0 10px #39ff14)' }} />
          <g className="spin-node" transform="translate(500, 950)">
            <ellipse cx={0} cy={0} rx={40} ry={8} fill="none" stroke="#39ff14" strokeWidth="1" strokeDasharray="6 8" opacity="0.8" />
          </g>
          <path d="M 420 950 L 580 950 M 500 935 L 500 965" stroke="#39ff14" strokeWidth="1" opacity="0.3" />

          {/* Yggdrasil Energy Veins & Fiber Optics */}
          {treeVisuals.paths.map((path, idx) => {
            const isFaded = selectedBranch && selectedBranch.name !== path.branchName && path.branchName !== 'main';
            const isSelected = selectedBranch && selectedBranch.name === path.branchName;

            return (
              <path
                key={`ygg-${idx}`}
                d={path.d}
                stroke={isSelected ? '#ffffff' : (path.color || '#39ff14')}
                strokeWidth={path.width + (isSelected && !path.isData ? 2 : 0)}
                strokeDasharray={path.dash}
                opacity={isFaded ? path.opacity * 0.1 : path.opacity}
                className={path.isData ? "data-pulse" : "yggdrasil-path"}
                style={{ transition: 'all 0.4s ease' }}
              />
            );
          })}

          {/* Cyber Foliage Canopy (High Performance O(1) DOM rendering) */}
          {Object.entries(treeVisuals.leafGroups || {}).map(([color, groups]) => {
            const isFaded = selectedBranch && selectedBranch.color !== color && color !== '#39ff14';
            return (
              <g key={`leaves-${color}`} stroke={color} strokeWidth="3.5" strokeLinecap="round" style={{ transition: 'opacity 0.4s ease', opacity: isFaded ? 0.1 : 1 }}>
                {groups.slow && <path d={groups.slow} className="cyber-leaf-slow" opacity={0.6} />}
                {groups.med && <path d={groups.med} className="cyber-leaf-med" opacity={0.8} />}
                {groups.fast && <path d={groups.fast} className="cyber-leaf-fast" opacity={0.9} />}
              </g>
            );
          })}

          {/* High-Tech Circuit Nodes and Branch Labels */}
          {treeVisuals.labels.map((lbl, idx) => {
            const isFaded = selectedBranch && selectedBranch.name !== lbl.text && selectedBranch.name !== lbl.branchData?.name;
            return (
              <g
                key={`lbl-${idx}`}
                transform={`translate(${lbl.x}, ${lbl.y})`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedBranch({ name: lbl.text || lbl.branchData?.name, color: lbl.color, data: lbl.branchData });
                }}
                style={{ cursor: 'pointer', pointerEvents: 'auto', transition: 'opacity 0.4s ease', opacity: isFaded ? 0.3 : 1 }}
              >

                {/* Huge Invisible Hitbox for easy clicking */}
                <circle cx={0} cy={0} r={32} fill="transparent" />

                {lbl.isNode && (
                  <g className="tech-node" style={{ filter: `drop-shadow(0 0 8px ${lbl.color})` }}>
                    <circle cx={0} cy={0} r={4.5} fill="#0a0f1a" stroke={lbl.color} strokeWidth="1.5" />
                    <circle cx={0} cy={0} r={1.5} fill={lbl.color} />
                    {/* Cyber brackets */}
                    <path d="M -7 -3 L -7 -7 L -3 -7" fill="none" stroke={lbl.color} strokeWidth="1" opacity="0.8" />
                    <path d="M 7 3 L 7 7 L 3 7" fill="none" stroke={lbl.color} strokeWidth="1" opacity="0.8" />
                  </g>
                )}

                {/* Horizontal readable text with heavy outline for perfect contrast */}
                {lbl.text && (
                  <g transform="translate(14, 4)">
                    <text className="yggdrasil-label" stroke="#0a0f1a" strokeWidth="4" strokeLinejoin="round" style={{ fontWeight: 800, fontSize: '14px' }}>
                      {lbl.text}
                    </text>
                    <text className="yggdrasil-label" fill="#fff" style={{ fontWeight: 800, fontSize: '14px', textShadow: `0 0 8px ${lbl.color}, 0 0 16px ${lbl.color}` }}>
                      {lbl.text}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Controls Overlay */}
      <div style={{ position: 'absolute', top: '120px', left: '40px', display: 'flex', flexDirection: 'column', gap: '16px', pointerEvents: 'auto', zIndex: 10 }}>
        <div style={{ background: 'rgba(10, 15, 26, 0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(57, 255, 20, 0.3)', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <button onClick={() => setTransform(p => ({ ...p, scale: Math.min(4, p.scale + 0.2) }))} style={{ background: 'transparent', border: 'none', color: '#39ff14', padding: '12px', cursor: 'pointer' }}><ZoomIn size={16} /></button>
          <div style={{ height: '1px', background: 'rgba(57, 255, 20, 0.3)', width: '100%' }}></div>
          <button onClick={() => setTransform(p => ({ ...p, scale: Math.max(0.3, p.scale - 0.2) }))} style={{ background: 'transparent', border: 'none', color: '#39ff14', padding: '12px', cursor: 'pointer' }}><ZoomOut size={16} /></button>
        </div>
        <button onClick={() => setTransform({ x: 0, y: 0, scale: 1 })} style={{ background: 'rgba(10, 15, 26, 0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(57, 255, 20, 0.3)', color: '#39ff14', padding: '10px', borderRadius: '12px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Sci-Fi Holographic Tooltip */}
      {selectedBranch && (
        <div style={{
          position: 'absolute',
          top: '24px',
          right: '24px',
          width: '320px',
          padding: '24px',
          background: 'rgba(10, 15, 26, 0.85)',
          backdropFilter: 'blur(16px)',
          border: `1px solid ${selectedBranch.color}80`,
          borderLeft: `4px solid ${selectedBranch.color}`,
          borderRadius: '12px',
          color: '#fff',
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px ${selectedBranch.color}30`,
          pointerEvents: 'auto',
          fontFamily: 'Inter, sans-serif',
          zIndex: 100,
          animation: 'fade-in 0.3s ease-out forwards'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', color: selectedBranch.color, textShadow: `0 0 10px ${selectedBranch.color}` }}>
                {selectedBranch.name}
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#8892b0' }}>Branch Evolution & Analytics</p>
            </div>
            <button
              onClick={() => setSelectedBranch(null)}
              style={{ background: 'transparent', border: 'none', color: '#8892b0', cursor: 'pointer', fontSize: '16px', padding: '4px' }}
            >✕</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
              <span style={{ color: '#8892b0' }}>Health Status</span>
              <span style={{ color: selectedBranch.name.includes('conflict') ? '#ff3366' : '#39ff14', fontWeight: 600 }}>
                {selectedBranch.name.includes('conflict') ? '⚠️ Requires Review' : '● Healthy Sync'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
              <span style={{ color: '#8892b0' }}>Recent Commits</span>
              <span style={{ color: '#e2e8f0' }}>{Math.floor(Math.random() * 8) + 2} new changes</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#8892b0' }}>Last Active</span>
              <span style={{ color: '#e2e8f0' }}>Just now</span>
            </div>
          </div>

          <button style={{
            marginTop: '20px',
            width: '100%',
            padding: '10px',
            background: `${selectedBranch.color}15`,
            border: `1px solid ${selectedBranch.color}60`,
            color: selectedBranch.color,
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'all 0.2s',
            textShadow: `0 0 8px ${selectedBranch.color}80`
          }}
            onMouseOver={(e) => e.currentTarget.style.background = `${selectedBranch.color}30`}
            onMouseOut={(e) => e.currentTarget.style.background = `${selectedBranch.color}15`}
          >
            Analyze Branch Diff
          </button>

          <style>{`
             @keyframes fade-in {
               from { opacity: 0; transform: translateY(-10px); }
               to { opacity: 1; transform: translateY(0); }
             }
           `}</style>
        </div>
      )}
    </div>
  );
};

export default BioluminescentTree;
