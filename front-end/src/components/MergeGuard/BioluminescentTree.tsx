import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export interface BranchData {
  id: string;
  name: string;
  color: string;
  glow: string;
  paths: string[];
  commits: { id: string; x: number; y: number; label: string; r?: number }[];
}

// Real Git Data from the repository
const defaultBranchesData: BranchData[] = [
  {
    id: 'main',
    name: 'main',
    color: '#4ade80',
    glow: 'glow-green',
    paths: [
      'M 500 400 C 490 350, 510 300, 500 250 C 480 200, 520 150, 500 100', // Center upward
      'M 480 400 C 475 350, 495 300, 500 250 C 485 200, 510 150, 500 100',
      'M 520 400 C 505 350, 525 300, 500 250 C 475 200, 530 150, 500 100',
    ],
    commits: [
      { id: 'ea90a55', x: 500, y: 400, label: '', r: 24 },
      { id: 'd7a90b1', x: 500, y: 250, label: '', r: 16 },
      { id: 'ca1f4f9', x: 500, y: 100, label: '3 conflict(s)', r: 16 }
    ]
  },
  {
    id: 'feat/bioluminescent-map',
    name: 'feat/bioluminescent-map',
    color: '#4ade80',
    glow: 'glow-green',
    paths: [
      'M 500 500 C 420 480, 350 400, 300 350 C 250 300, 150 250, 100 200',
      'M 480 510 C 410 490, 340 410, 300 350 C 240 310, 140 260, 100 200',
      'M 520 490 C 430 470, 360 390, 300 350 C 260 290, 160 240, 100 200',
      'M 300 350 C 280 320, 250 280, 220 250' // Sub-branch
    ],
    commits: [
      { id: '5d3ef1', x: 300, y: 350, label: 'Commit nodes', r: 16 },
      { id: '8a9c2b', x: 100, y: 200, label: 'Bioluminescent Neural Map', r: 18 },
      { id: 'sub1', x: 220, y: 250, label: 'Interact with glowing nodes', r: 12 }
    ]
  },
  {
    id: 'feat/bluminescent-1',
    name: 'feat/bluminescent-1',
    color: '#4ade80',
    glow: 'glow-green',
    paths: [
      'M 500 650 C 420 620, 320 520, 250 480 C 180 440, 120 380, 80 320',
      'M 480 660 C 410 630, 310 530, 250 480 C 170 450, 110 390, 80 320',
      'M 520 640 C 430 610, 330 510, 250 480 C 190 430, 130 370, 80 320',
      'M 250 480 C 220 500, 180 520, 140 540' // Sub-branch
    ],
    commits: [
      { id: 'f2c8d1', x: 250, y: 480, label: 'Commit nodes', r: 16 },
      { id: '1e3a4b', x: 80, y: 320, label: 'feat/bluminescent-1', r: 18 },
      { id: 'sub2', x: 140, y: 540, label: '', r: 10 }
    ]
  },
  {
    id: 'feat/biolouiloper-oranogn',
    name: 'feat/biolouiloper-oranogn',
    color: '#c084fc',
    glow: 'glow-purple',
    paths: [
      'M 500 450 C 580 430, 680 350, 750 320 C 820 290, 880 200, 920 150',
      'M 480 440 C 570 420, 670 340, 750 320 C 810 280, 870 190, 920 150',
      'M 520 460 C 590 440, 690 360, 750 320 C 830 300, 890 210, 920 150',
      'M 750 320 C 780 350, 820 380, 850 400'
    ],
    commits: [
      { id: 'b7f1e9', x: 750, y: 320, label: 'Commit nodes', r: 16 },
      { id: '3d5c7a', x: 920, y: 150, label: 'feat/biolouiloper-oranogn', r: 18 },
      { id: 'sub3', x: 850, y: 400, label: '', r: 12 }
    ]
  },
  {
    id: 'release/v2.1',
    name: 'release/v2.1',
    color: '#3b82f6',
    glow: 'glow-blue',
    paths: [
      'M 500 550 C 560 540, 640 480, 700 420 C 760 360, 850 300, 900 240',
      'M 480 540 C 550 530, 630 470, 700 420 C 750 350, 840 290, 900 240',
      'M 520 560 C 570 550, 650 490, 700 420 C 770 370, 860 310, 900 240',
      'M 700 420 C 680 380, 650 350, 620 320'
    ],
    commits: [
      { id: 'c9a2f4', x: 700, y: 420, label: 'Commit nodes', r: 16 },
      { id: '1b8e6d', x: 900, y: 240, label: 'release/v2.1', r: 18 },
      { id: 'sub4', x: 620, y: 320, label: '', r: 12 }
    ]
  },
  {
    id: 'hotfix/conflict-resolution',
    name: 'hotfix/conflict-resolution',
    color: '#f43f5e',
    glow: 'glow-red',
    paths: [
      'M 500 680 C 600 630, 700 550, 800 500 S 880 450, 900 400',
      'M 480 670 C 590 620, 690 540, 800 500 S 870 440, 900 400',
      'M 520 690 C 610 640, 710 560, 800 500 S 890 460, 900 400',
      'M 800 500 C 820 530, 850 560, 880 580'
    ],
    commits: [
      { id: 'hot1', x: 700, y: 560, label: 'conflict #1', r: 16 },
      { id: 'hot2', x: 900, y: 400, label: 'hotfix/conflict-resolution', r: 18 },
      { id: 'hot3', x: 800, y: 500, label: 'conflict #2', r: 14 },
      { id: 'sub5', x: 880, y: 580, label: '', r: 10 }
    ]
  },
  {
    id: 'conflict1',
    name: 'conflict #1',
    color: '#f43f5e',
    glow: 'glow-red',
    paths: [
      'M 535 400 C 600 420, 640 450, 680 460 S 760 480, 820 480'
    ],
    commits: [
      { id: 'c1_c1', x: 680, y: 460, label: 'conflict #1', r: 16 }
    ]
  },
  {
    id: 'conflict2',
    name: 'conflict #2',
    color: '#f43f5e',
    glow: 'glow-red',
    paths: [
      'M 530 600 C 600 600, 630 590, 660 580 S 740 560, 800 540'
    ],
    commits: [
      { id: 'c2_c1', x: 660, y: 580, label: 'conflict #2', r: 16 },
      { id: 'c2_c2', x: 800, y: 540, label: 'Commit nodes', r: 14 }
    ]
  }
];

const GeoNode = ({ cx, cy, r, color, filter }: { cx: number, cy: number, r: number, color: string, filter?: string }) => {
  const gradId = `grad-geo-${Math.random().toString(36).substr(2, 5)}`;
  return (
    <g filter={filter} transform={`translate(${cx}, ${cy})`} opacity="0.95">
      <defs>
        <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="40%" stopColor={color} stopOpacity="0.6" />
          <stop offset="100%" stopColor={color} stopOpacity="0.1" />
        </radialGradient>
      </defs>
      {/* Intense inner glowing crystal base */}
      <polygon points={`0,${-r} ${r * 0.866},${-r * 0.5} ${r * 0.866},${r * 0.5} 0,${r} ${-r * 0.866},${r * 0.5} ${-r * 0.866},${-r * 0.5}`} fill={`url(#${gradId})`} stroke={color} strokeWidth="2" />
      {/* Geometric facets with bright translucent fills */}
      <polygon points={`0,${-r} ${r * 0.866},${-r * 0.5} 0,0`} fill="#ffffff" opacity="0.15" stroke={color} strokeWidth="1" />
      <polygon points={`0,${-r} ${-r * 0.866},${-r * 0.5} 0,0`} fill="#000000" opacity="0.2" stroke={color} strokeWidth="1" />
      <polygon points={`${r * 0.866},${-r * 0.5} ${r * 0.866},${r * 0.5} 0,0`} fill="#ffffff" opacity="0.25" stroke={color} strokeWidth="1" />
      <polygon points={`${-r * 0.866},${-r * 0.5} ${-r * 0.866},${r * 0.5} 0,0`} fill="#000000" opacity="0.1" stroke={color} strokeWidth="1" />
      <polygon points={`${r * 0.866},${r * 0.5} 0,${r} 0,0`} fill="#ffffff" opacity="0.05" stroke={color} strokeWidth="1" />
      <polygon points={`${-r * 0.866},${r * 0.5} 0,${r} 0,0`} fill="#000000" opacity="0.3" stroke={color} strokeWidth="1" />
      {/* Very bright core */}
      <circle cx="0" cy="0" r={r * 0.25} fill="#ffffff" filter="blur(2px)" />
      <circle cx="0" cy="0" r={r * 0.1} fill="#ffffff" />
    </g>
  );
};

const CellNode = ({ cx, cy, r, color, filter }: { cx: number, cy: number, r: number, color: string, filter?: string }) => {
  const gradId = `grad-cell-${Math.random().toString(36).substr(2, 5)}`;
  return (
    <g filter={filter} transform={`translate(${cx}, ${cy})`} opacity="0.95">
      <defs>
        <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="30%" stopColor={color} stopOpacity="0.8" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Bio-aura */}
      <circle cx="0" cy="0" r={r + 8} fill={`url(#${gradId})`} opacity="0.4" filter="blur(3px)" />
      {/* Cell membrane */}
      <circle cx="0" cy="0" r={r} fill={`rgba(10, 15, 30, 0.4)`} stroke={color} strokeWidth="1.5" />
      {/* Inner energy core */}
      <circle cx="0" cy="0" r={r * 0.4} fill="#ffffff" filter="blur(1px)" />
      <circle cx="0" cy="0" r={r * 0.15} fill="#ffffff" />
    </g>
  );
};


interface BioluminescentTreeProps {
  customBranchesData?: BranchData[] | null;
}

const BioluminescentTree: React.FC<BioluminescentTreeProps> = ({ customBranchesData }) => {
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);

  const branchesData = customBranchesData && customBranchesData.length > 0 ? customBranchesData : defaultBranchesData;

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    const zoomAmount = e.deltaY * -0.002;
    setTransform(prev => {
      const newScale = Math.max(0.3, Math.min(4, prev.scale + zoomAmount));
      return { ...prev, scale: newScale };
    });
  };

  const handleZoomIn = () => setTransform(prev => ({ ...prev, scale: Math.min(4, prev.scale + 0.2) }));
  const handleZoomOut = () => setTransform(prev => ({ ...prev, scale: Math.max(0.3, prev.scale - 0.2) }));
  const handleZoomReset = () => setTransform({ x: 0, y: 0, scale: 1 });

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    const svgRect = e.currentTarget.getBoundingClientRect();
    const scaleRatio = Math.min(svgRect.width / 1000, svgRect.height / 950) * transform.scale;

    setTransform(prev => ({
      ...prev,
      x: prev.x + e.movementX / scaleRatio,
      y: prev.y + e.movementY / scaleRatio
    }));
  };

  // Crystal Faceted Trunk Generator
  const levels = 10;
  const grid = Array.from({ length: levels }).map((_, i) => {
    const progress = i / (levels - 1);
    const y = 820 - progress * 400;
    const rOuter = 90 * Math.pow(1 - progress, 1.5) + 5;
    const rInner = 40 * Math.pow(1 - progress, 1.2) + 2;
    const yOffset = (i % 2 === 0) ? 15 * (1 - progress) : -15 * (1 - progress);
    return {
      lo: { x: 500 - rOuter, y: y + yOffset },
      li: { x: 500 - rInner, y },
      c: { x: 500, y: y - yOffset },
      ri: { x: 500 + rInner, y },
      ro: { x: 500 + rOuter, y: y + yOffset }
    };
  });

  const polygons = [];
  const lines = [];

  for (let i = 0; i < levels - 1; i++) {
    const row = grid[i];
    const next = grid[i + 1];

    // Left outer to Left inner
    polygons.push({ pts: `${row.lo.x},${row.lo.y} ${row.li.x},${row.li.y} ${next.li.x},${next.li.y}`, op: 0.15 });
    polygons.push({ pts: `${row.lo.x},${row.lo.y} ${next.li.x},${next.li.y} ${next.lo.x},${next.lo.y}`, op: 0.25 });

    // Left inner to Center
    polygons.push({ pts: `${row.li.x},${row.li.y} ${row.c.x},${row.c.y} ${next.c.x},${next.c.y}`, op: 0.35 });
    polygons.push({ pts: `${row.li.x},${row.li.y} ${next.c.x},${next.c.y} ${next.li.x},${next.li.y}`, op: 0.45 });

    // Center to Right inner
    polygons.push({ pts: `${row.c.x},${row.c.y} ${row.ri.x},${row.ri.y} ${next.ri.x},${next.ri.y}`, op: 0.35 });
    polygons.push({ pts: `${row.c.x},${row.c.y} ${next.ri.x},${next.ri.y} ${next.c.x},${next.c.y}`, op: 0.25 });

    // Right inner to Right outer
    polygons.push({ pts: `${row.ri.x},${row.ri.y} ${row.ro.x},${row.ro.y} ${next.ro.x},${next.ro.y}`, op: 0.15 });
    polygons.push({ pts: `${row.ri.x},${row.ri.y} ${next.ro.x},${next.ro.y} ${next.ri.x},${next.ri.y}`, op: 0.2 });

    // Lines for the wireframe structure
    lines.push(`M ${row.lo.x} ${row.lo.y} L ${next.lo.x} ${next.lo.y}`);
    lines.push(`M ${row.li.x} ${row.li.y} L ${next.li.x} ${next.li.y}`);
    lines.push(`M ${row.c.x} ${row.c.y} L ${next.c.x} ${next.c.y}`);
    lines.push(`M ${row.ri.x} ${row.ri.y} L ${next.ri.x} ${next.ri.y}`);
    lines.push(`M ${row.ro.x} ${row.ro.y} L ${next.ro.x} ${next.ro.y}`);

    // Cross lines
    lines.push(`M ${row.lo.x} ${row.lo.y} L ${row.li.x} ${row.li.y} L ${row.c.x} ${row.c.y} L ${row.ri.x} ${row.ri.y} L ${row.ro.x} ${row.ro.y}`);
    lines.push(`M ${row.lo.x} ${row.lo.y} L ${next.li.x} ${next.li.y}`);
    lines.push(`M ${row.li.x} ${row.li.y} L ${next.c.x} ${next.c.y}`);
    lines.push(`M ${row.c.x} ${row.c.y} L ${next.ri.x} ${next.ri.y}`);
    lines.push(`M ${row.ri.x} ${row.ri.y} L ${next.ro.x} ${next.ro.y}`);
  }

  // Generate geometric roots
  const roots = [
    { pts: `300,900 ${grid[0].lo.x},${grid[0].lo.y} ${grid[0].li.x},${grid[0].li.y} 330,880`, op: 0.15 },
    { pts: `330,880 ${grid[0].li.x},${grid[0].li.y} ${grid[0].c.x},${grid[0].c.y} 450,910`, op: 0.25 },
    { pts: `450,910 ${grid[0].c.x},${grid[0].c.y} ${grid[0].ri.x},${grid[0].ri.y} 550,910`, op: 0.25 },
    { pts: `550,910 ${grid[0].ri.x},${grid[0].ri.y} ${grid[0].ro.x},${grid[0].ro.y} 670,880`, op: 0.15 },
    { pts: `670,880 ${grid[0].ro.x},${grid[0].ro.y} 700,900 680,910`, op: 0.1 },
  ];

  const rootLines = [
    `M 250 950 C 280 920, 290 910, 300 900 L ${grid[0].lo.x} ${grid[0].lo.y}`,
    `M 300 900 L 330 880 L ${grid[0].li.x} ${grid[0].li.y}`,
    `M 330 880 L 450 910 L ${grid[0].c.x} ${grid[0].c.y}`,
    `M 450 910 L 550 910 L ${grid[0].ri.x} ${grid[0].ri.y}`,
    `M 550 910 L 670 880 L ${grid[0].ro.x} ${grid[0].ro.y}`,
    `M 670 880 L 700 900 C 710 910, 720 920, 750 950`,
    `M 450 910 C 430 940, 400 950, 380 980`,
    `M 550 910 C 570 940, 600 950, 620 980`
  ];

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1000 950"
        preserveAspectRatio="xMidYMid meet"
        style={{ pointerEvents: 'auto', cursor: isDragging ? 'grabbing' : 'grab' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >

        {/* Nebulas (Static Background) */}
        <ellipse cx="500" cy="250" rx="450" ry="300" fill="url(#nebula-purple)" filter="blur(80px)" opacity="0.4" />
        <ellipse cx="500" cy="650" rx="350" ry="250" fill="url(#nebula-green)" filter="blur(70px)" opacity="0.4" />

        <defs>
          <radialGradient id="nebula-purple" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id="nebula-green" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id="nebula-cyan" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>

          {/* Intense Glow Filters */}
          <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur1" />
            <feGaussianBlur stdDeviation="15" result="blur2" />
            <feMerge><feMergeNode in="blur2" /><feMergeNode in="blur1" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur1" />
            <feGaussianBlur stdDeviation="12" result="blur2" />
            <feMerge><feMergeNode in="blur2" /><feMergeNode in="blur1" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-purple" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur1" />
            <feGaussianBlur stdDeviation="12" result="blur2" />
            <feMerge><feMergeNode in="blur2" /><feMergeNode in="blur1" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur1" />
            <feGaussianBlur stdDeviation="12" result="blur2" />
            <feMerge><feMergeNode in="blur2" /><feMergeNode in="blur1" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-blue" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur1" />
            <feGaussianBlur stdDeviation="12" result="blur2" />
            <feMerge><feMergeNode in="blur2" /><feMergeNode in="blur1" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>

          {/* Organic Nerve Bundle Generators */}
          <filter id="nerve-warp-1" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="2" result="noise" seed="1" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="20" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="nerve-warp-2" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" result="noise" seed="4" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="15" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="nerve-warp-3" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="1" result="noise" seed="7" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="25" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>

        <g transform={`translate(${transform.x}, ${transform.y}) translate(500, 475) scale(${transform.scale}) translate(-500, -475)`}>

          {/* MASSIVE CRYSTAL CANOPY (Low-Poly Nebula Leaves) */}
          {(() => {
            // Generate a jittered grid for the canopy mesh
            const cols = 15;
            const rows = 8;
            const points: { x: number, y: number }[] = [];

            for (let y = 0; y <= rows; y++) {
              for (let x = 0; x <= cols; x++) {
                // Base grid positions spanning wide across the top
                const baseX = -200 + (x * 90);
                const baseY = -100 + (y * 50);

                // Add irregular jitter, more jitter at the edges
                const jitterX = (x === 0 || x === cols) ? 0 : (Math.sin(x * 12.3 + y * 4.5) * 45);
                const jitterY = (y === 0 || y === rows) ? 0 : (Math.cos(x * 7.2 + y * 19.1) * 35);

                points.push({ x: baseX + jitterX, y: baseY + jitterY });
              }
            }

            const faces = [];
            for (let y = 0; y < rows; y++) {
              for (let x = 0; x < cols; x++) {
                const tl = y * (cols + 1) + x;
                const tr = tl + 1;
                const bl = (y + 1) * (cols + 1) + x;
                const br = bl + 1;

                // Alternate triangulation direction for a more organic look
                if ((x + y) % 2 === 0) {
                  faces.push([tl, tr, bl]);
                  faces.push([tr, br, bl]);
                } else {
                  faces.push([tl, tr, br]);
                  faces.push([tl, br, bl]);
                }
              }
            }

            // Outer bounds for the glowing blob
            const blobPath = "M -100 100 C 200 -50, 800 -50, 1100 100 C 1200 300, 800 350, 500 300 C 200 350, -200 300, -100 100";

            return (
              <g>
                {/* Massive Outer Glow */}
                <path d={blobPath} fill="url(#nebula-purple)" opacity="0.6" filter="blur(60px)" />
                <path d="M 100 100 C 300 0, 700 0, 900 100 C 1000 250, 700 300, 500 250 C 300 300, 0 250, 100 100" fill="url(#nebula-cyan)" opacity="0.5" filter="blur(40px)" />

                {/* Triangulated Crystal Faces */}
                <g stroke="#a855f7" strokeWidth="1" strokeLinejoin="round" opacity="0.9">
                  {faces.map((f, i) => {
                    const cx = (points[f[0]].x + points[f[1]].x + points[f[2]].x) / 3;
                    const cy = (points[f[0]].y + points[f[1]].y + points[f[2]].y) / 3;

                    // Distance from center (elliptical bounds)
                    const dist = Math.pow((cx - 500) / 600, 2) + Math.pow((cy - 120) / 220, 2);
                    const limit = 1.0 + Math.sin(cx * 0.02) * 0.2; // Wavy organic edge

                    if (dist > limit) return null; // Drop faces outside the organic canopy shape

                    const pts = `${points[f[0]].x},${points[f[0]].y} ${points[f[1]].x},${points[f[1]].y} ${points[f[2]].x},${points[f[2]].y}`;

                    // Pseudo-random coloring based on index
                    const colorType = (i * 7) % 4;
                    let fill, opacity;

                    if (colorType === 0) {
                      fill = "url(#nebula-cyan)"; opacity = 0.5;
                    } else if (colorType === 1) {
                      fill = "url(#nebula-purple)"; opacity = 0.6;
                    } else if (colorType === 2) {
                      fill = "url(#nebula-green)"; opacity = 0.2;
                    } else {
                      fill = "rgba(15, 20, 35, 0.6)"; opacity = 0.7; // Dark gaps
                    }

                    // Removing filter={} from individual polygons massively improves rendering performance
                    return (
                      <polygon
                        key={`face-${i}`}
                        points={pts}
                        fill={fill}
                        opacity={opacity}
                      />
                    );
                  })}
                </g>

                {/* Vertex Nodes (Stars) */}
                {points.map((p, i) => {
                  const dist = Math.pow((p.x - 500) / 600, 2) + Math.pow((p.y - 120) / 220, 2);
                  if (dist > 1.2 || (i * 17) % 100 > 30) return null; // Only some stars inside bounds
                  return <circle key={`star-${i}`} cx={p.x} cy={p.y} r={Math.random() > 0.8 ? 3 : 1.5} fill="#ffffff" filter="url(#glow-cyan)" />
                })}
              </g>
            );
          })()}

          {/* MAIN TRUNK - Crystal Faceted Lattice */}
          <g>
            {/* Trunk Gradient Definition */}
            <defs>
              <linearGradient id="trunk-grad-light" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34d399" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#059669" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="trunk-grad-dark" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#059669" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#064e3b" stopOpacity="0.3" />
              </linearGradient>
            </defs>

            {/* Glowing Core Beam (behind faces) */}
            <path 
              d={`M ${grid[0].c.x} ${grid[0].c.y} L ${grid[levels - 1].c.x} ${grid[levels - 1].c.y}`} 
              stroke="#ffffff" strokeWidth="18" fill="none" filter="blur(8px)" opacity="0.6" 
            />
            <path 
              d={`M ${grid[0].c.x} ${grid[0].c.y} L ${grid[levels - 1].c.x} ${grid[levels - 1].c.y}`} 
              stroke="#a7f3d0" strokeWidth="6" fill="none" filter="blur(2px)" opacity="0.9" 
            />
            <path 
              d={`M ${grid[0].c.x} ${grid[0].c.y} L ${grid[levels - 1].c.x} ${grid[levels - 1].c.y}`} 
              stroke="#ffffff" strokeWidth="2" fill="none" 
            />

            <g filter="url(#glow-green)">
              {/* Trunk Faces - Solid Volumetric Fills */}
              {polygons.map((poly, idx) => (
                <polygon 
                  key={`trunk-face-${idx}`} 
                  points={poly.pts} 
                  fill={idx % 2 === 0 ? "url(#trunk-grad-light)" : "url(#trunk-grad-dark)"}
                  opacity={poly.op + 0.3} // Increase opacity for solid feel
                  stroke="#6ee7b7"
                  strokeWidth="0.5"
                />
              ))}

              {/* Root Faces - Solid Volumetric Fills */}
              {roots.map((root, idx) => (
                <polygon 
                  key={`root-face-${idx}`} 
                  points={root.pts} 
                  fill={idx % 2 === 0 ? "url(#trunk-grad-light)" : "url(#trunk-grad-dark)"}
                  opacity={root.op + 0.3} 
                  stroke="#6ee7b7"
                  strokeWidth="0.5"
                />
              ))}

              {/* Minimal Wireframe Structure Lines (only highlights) */}
              <g stroke="#ffffff" strokeWidth="1" strokeLinejoin="round" opacity="0.4">
                {lines.filter((_, i) => i % 3 === 0).map((line, idx) => (
                  <path key={`trunk-line-hi-${idx}`} d={line} fill="none" />
                ))}
              </g>
            </g>
          </g>

          {/* Render Branches, Commits & Text Paths */}
          {branchesData.map((branch) => (
            <g key={branch.id}>
              {branch.paths.map((pathStr, i) => {
                // Skip the fake spaghetti offset paths from the old implementation.
                // In default data, indices 1 and 2 are offsets of index 0.
                if ((i === 1 || i === 2) && branch.paths.length >= 3) return null;

                const pathId = `branch-path-${branch.id}-${i}`;
                const isSubBranch = i > 0;
                
                // Dynamic stroke widths for tapering effect
                const auraWidth = isSubBranch ? "10" : "18";
                const tubeWidth = isSubBranch ? "4" : "8";
                const coreWidth = isSubBranch ? "1.5" : "3";

                return (
                  <g key={pathId}>
                    {/* Invisible base path for text to follow */}
                    <path id={pathId} d={pathStr} fill="none" stroke="none" />

                    {/* Volumetric Layer 1: Outer Aura */}
                    <path 
                      d={pathStr} 
                      fill="none" 
                      stroke={branch.color} 
                      strokeWidth={auraWidth} 
                      filter={branch.glow ? `url(#${branch.glow})` : undefined} 
                      opacity="0.3" 
                      strokeLinecap="round" 
                    />
                    <path 
                      d={pathStr} 
                      fill="none" 
                      stroke={branch.color} 
                      strokeWidth={parseInt(auraWidth) + 8} 
                      filter="blur(12px)" 
                      opacity="0.2" 
                      strokeLinecap="round" 
                    />

                    {/* Volumetric Layer 2: Neon Tube */}
                    <path 
                      d={pathStr} 
                      fill="none" 
                      stroke={branch.color} 
                      strokeWidth={tubeWidth} 
                      filter="blur(2px)" 
                      opacity="0.8" 
                      strokeLinecap="round" 
                    />

                    {/* Volumetric Layer 3: Bright Energy Core */}
                    <path 
                      d={pathStr} 
                      fill="none" 
                      stroke="#ffffff" 
                      strokeWidth={coreWidth} 
                      opacity="0.9" 
                      strokeLinecap="round" 
                    />

                    {/* Curving Branch Label */}
                    {i === 0 && branch.name !== 'main' && (
                      <text fill={branch.color} fontSize="12" fontWeight="bold" letterSpacing="1" filter={branch.glow ? `url(#${branch.glow})` : undefined}>
                        <textPath href={`#${pathId}`} startOffset="50%" textAnchor="middle" dy="-8">
                          {branch.name}
                        </textPath>
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Commits (Nodes) */}
              {branch.commits.map((commit) => (
                (commit.r && commit.r >= 20)
                  ? <GeoNode key={commit.id} cx={commit.x} cy={commit.y} r={commit.r} color={branch.color} filter={branch.glow ? `url(#${branch.glow})` : undefined} />
                  : <CellNode key={commit.id} cx={commit.x} cy={commit.y} r={commit.r || 16} color={branch.color} filter={branch.glow ? `url(#${branch.glow})` : undefined} />
              ))}
            </g>
          ))}

          {/* Major Intersection Nodes on Trunk */}
          <GeoNode cx={grid[2].c.x} cy={grid[2].c.y} r={32} color="#4ade80" filter="url(#glow-green)" />
          <GeoNode cx={grid[5].c.x} cy={grid[5].c.y} r={26} color="#4ade80" filter="url(#glow-green)" />

          {/* Root Commits (at the ends of the roots) */}
          <GeoNode cx={300} cy={900} r={18} color="#22c55e" filter="url(#glow-green)" />
          <GeoNode cx={450} cy={910} r={18} color="#22c55e" filter="url(#glow-green)" />
          <GeoNode cx={700} cy={900} r={18} color="#22c55e" filter="url(#glow-green)" />

          {/* Labels */}
          <text x="560" y="550" fill="#4ade80" fontSize="16" fontWeight="bold" filter="url(#glow-green)" letterSpacing="3">MAIN</text>
          <text x="560" y="570" fill="#4ade80" fontSize="16" fontWeight="bold" filter="url(#glow-green)" letterSpacing="3">TRUNK</text>

          <text x="500" y="820" fill="#94a3b8" fontSize="14" textAnchor="middle" letterSpacing="1">Project Foundation (Commits)</text>

          {/* HTML Overlays for commit labels moved inside SVG for perfect scaling */}
          {branchesData.map((branch) =>
            branch.commits.map((commit) => {
              if (!commit.label) return null;
              return (
                <foreignObject
                  key={`label-${commit.id}`}
                  x={commit.x + 15}
                  y={commit.y - 35}
                  width="250"
                  height="60"
                  style={{ overflow: 'visible' }}
                >
                  <div
                    className="commit-label"
                    style={{
                      position: 'relative',
                      display: 'inline-block',
                      color: branch.color || '#e2e8f0',
                      background: 'rgba(20, 25, 40, 0.8)',
                      border: `1px solid ${branch.color ? branch.color + '55' : 'rgba(255, 255, 255, 0.1)'}`,
                      padding: '6px 12px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {commit.label}
                  </div>
                </foreignObject>
              );
            })
          )}

          {/* Root commit labels */}
          <foreignObject x="285" y="895" width="100" height="40" style={{ overflow: 'visible' }}>
            <div className="commit-label" style={{ position: 'relative', color: '#4ade80', background: 'rgba(20, 25, 40, 0.8)', padding: '4px 8px', borderRadius: '8px', fontSize: '11px', display: 'inline-block' }}>ca3f4g</div>
          </foreignObject>
          <foreignObject x="485" y="895" width="100" height="40" style={{ overflow: 'visible' }}>
            <div className="commit-label" style={{ position: 'relative', color: '#4ade80', background: 'rgba(20, 25, 40, 0.8)', padding: '4px 8px', borderRadius: '8px', fontSize: '11px', display: 'inline-block' }}>6d2e1a</div>
          </foreignObject>
          <foreignObject x="685" y="895" width="100" height="40" style={{ overflow: 'visible' }}>
            <div className="commit-label" style={{ position: 'relative', color: '#4ade80', background: 'rgba(20, 25, 40, 0.8)', padding: '4px 8px', borderRadius: '8px', fontSize: '11px', display: 'inline-block' }}>8b1d9c</div>
          </foreignObject>

          {/* Branch Name Path Labels */}
          {/* (Text labels are now natively rendered along the SVGs via <textPath>!) */}

          {/* Upper Canopy Labels */}
          <foreignObject x="650" y="100" width="250" height="60" style={{ overflow: 'visible' }}>
            <div className="commit-label" style={{ position: 'relative', color: '#a78bfa', fontSize: '14px', border: 'none', background: 'rgba(20, 25, 40, 0.6)', padding: '8px 16px', borderRadius: '20px', transform: 'none', left: 'auto', top: 'auto', display: 'inline-block' }}>Project Overview (Canopy)</div>
          </foreignObject>
          <foreignObject x="850" y="70" width="150" height="40" style={{ overflow: 'visible' }}>
            <div className="commit-label" style={{ position: 'relative', color: '#94a3b8', fontSize: '12px', border: 'none', transform: 'none', left: 'auto', top: 'auto', display: 'inline-block' }}>3 conflict(s)</div>
          </foreignObject>
        </g>
      </svg>

      {/* Zoom Controls */}
      <div style={{ position: 'absolute', bottom: '170px', right: '32px', display: 'flex', flexDirection: 'column', gap: '16px', pointerEvents: 'auto', zIndex: 10 }}>
        <div style={{ background: 'rgba(10, 14, 25, 0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
          <button onClick={handleZoomIn} style={{ background: 'transparent', border: 'none', color: '#e2e8f0', padding: '12px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <ZoomIn size={16} />
          </button>
          <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.05)', width: '100%' }}></div>
          <button onClick={handleZoomOut} style={{ background: 'transparent', border: 'none', color: '#e2e8f0', padding: '12px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <ZoomOut size={16} />
          </button>
        </div>
        <button onClick={handleZoomReset} style={{ background: 'rgba(10, 14, 25, 0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.05)', color: '#e2e8f0', padding: '10px 16px', borderRadius: '12px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', letterSpacing: '1px' }}>
          <RotateCcw size={14} />
          RESET
        </button>
      </div>
    </div>
  );
};

export default BioluminescentTree;
