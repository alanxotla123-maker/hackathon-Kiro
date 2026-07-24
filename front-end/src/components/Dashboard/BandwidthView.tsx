import React, { useState, useEffect } from 'react'
import {
  GitBranch, GitMerge, Activity, FileText, ArrowLeft,
  Columns, AlignLeft, Copy, Check, Plus,
  AlertTriangle, X, Zap, Code
} from 'lucide-react'

// ══════════════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════════════
type BwTab      = 'home' | 'tree' | 'commits'
type LineKind   = 'normal' | 'added' | 'removed' | 'conflict-ours' | 'conflict-sep' | 'conflict-theirs'
type FileStatus = 'modified' | 'added' | 'deleted'
type DiffMode   = 'split' | 'unified'
type BranchSide = 'left' | 'right'
type BranchStatus = 'active' | 'merged' | 'ahead' | 'conflicts'

interface BranchCommit { id: string; hash: string; msg: string }

interface BranchData {
  id: string; shortName: string; color: string
  forkFromMainIndex: number
  mergeIntoMainIndex: number | null
  commits: BranchCommit[]
  status: BranchStatus
  side: BranchSide
}

interface MainCommit {
  id: string; hash: string; msg: string; date: string
  isMerge?: boolean; mergedBranch?: string
}

interface DiffLine {
  leftNum?: number; rightNum?: number; kind: LineKind
  leftContent?: string; rightContent?: string
}

interface MockFile {
  id: string; path: string; name: string
  status: FileStatus; additions: number; deletions: number; conflicts: number
  diff: DiffLine[]
}

// ══════════════════════════════════════════════════════════════════
// Tree Layout Constants
// ══════════════════════════════════════════════════════════════════
const TRUNK_X       = 380
const SVG_WIDTH     = 920
const COMMIT_SPACING = 68
const TOP_PAD       = 90

const cY  = (i: number)               => TOP_PAD + i * COMMIT_SPACING
const bLen = (n: number)               => Math.min(55 + n * 22, 310)
const bAng = (n: number)               => n <= 2 ? 0 : n <= 5 ? -0.087 : n <= 10 ? -0.21 : -0.35

const pseudoRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const getQuadPoint = (p0: {x:number,y:number}, p1: {x:number,y:number}, p2: {x:number,y:number}, t: number) => {
  const x = (1-t)*(1-t)*p0.x + 2*(1-t)*t*p1.x + t*t*p2.x
  const y = (1-t)*(1-t)*p0.y + 2*(1-t)*t*p1.y + t*t*p2.y
  return { x, y }
}

const getOrganicBranchData = (fi: number, n: number, side: BranchSide, isActive: boolean, branchId: string) => {
  const fy = cY(fi)
  const dir = side === 'right' ? 1 : -1
  const len = bLen(n)
  
  // Base branch angle (always upwards from trunk)
  const ang = Math.abs(bAng(n)) * -1
  
  // Calculate tip position assuming right side first
  const tipX0 = TRUNK_X + len * Math.cos(ang)
  const tipY0 = fy + len * Math.sin(ang)
  const cpx0 = TRUNK_X + 48
  
  // Apply direction to get final tip position
  const tipX = TRUNK_X + dir * (tipX0 - TRUNK_X)
  const tipY = tipY0
  const cpx = TRUNK_X + dir * 48
  
  const stemPath = `M ${TRUNK_X} ${fy} Q ${cpx} ${fy} ${tipX} ${tipY}`

  if (!isActive || n === 1) {
    return {
      tipX, tipY, fy,
      dots: [{ x: tipX, y: tipY, isTip: true, idx: n - 1 }],
      paths: [stemPath],
      stemPath
    }
  }

  const dots = []
  const paths = [stemPath]
  
  let hash = 0
  for (let i = 0; i < branchId.length; i++) hash = branchId.charCodeAt(i) + ((hash << 5) - hash)

  for (let i = 0; i < n; i++) {
    const isTip = i === n - 1
    if (isTip) {
      dots.push({ x: tipX, y: tipY, isTip: true, idx: i })
    } else {
      const t = (i + 1) / n
      // Find point along the quadratic curve
      const stemPt0 = getQuadPoint({x: TRUNK_X, y: fy}, {x: cpx0, y: fy}, {x: tipX0, y: tipY0}, t)
      
      const sideDir = i % 2 === 0 ? 1 : -1
      const r = pseudoRandom(hash + i)
      const branchLen = 12 + r * 18
      const perpAng = ang + (sideDir * (Math.PI / 2.2))
      
      const leafX0 = stemPt0.x + branchLen * Math.cos(perpAng)
      const leafY0 = stemPt0.y + branchLen * Math.sin(perpAng)
      
      // Apply direction
      const stemPtX = TRUNK_X + dir * (stemPt0.x - TRUNK_X)
      const stemPtY = stemPt0.y
      const leafX = TRUNK_X + dir * (leafX0 - TRUNK_X)
      const leafY = leafY0
      
      dots.push({ x: leafX, y: leafY, isTip: false, idx: i })
      
      // Curve connecting stem to leaf
      const subCpx = stemPtX + (leafX - stemPtX) * 0.4
      const subCpy = stemPtY + (leafY - stemPtY) * 0.9
      paths.push(`M ${stemPtX} ${stemPtY} Q ${subCpx} ${subCpy} ${leafX} ${leafY}`)
    }
  }

  return { tipX, tipY, fy, dots, paths, stemPath }
}

// ══════════════════════════════════════════════════════════════════
// Mock Data
// ══════════════════════════════════════════════════════════════════
const MAIN_COMMITS: MainCommit[] = [
  { id: 'mc0',  hash: '7f2a1b9', msg: 'fix: resolve token expiry edge case',        date: '2h ago' },
  { id: 'mc1',  hash: 'a3b4c5d', msg: "Merge branch 'feature/auth-v2'",              date: '1d ago',  isMerge: true, mergedBranch: 'feature/auth-v2' },
  { id: 'mc2',  hash: 'e6f7891', msg: 'refactor: clean up user service',             date: '2d ago' },
  { id: 'mc3',  hash: 'b2c3d4e', msg: "Merge branch 'fix/token-expiry'",             date: '3d ago',  isMerge: true, mergedBranch: 'fix/token-expiry' },
  { id: 'mc4',  hash: 'f5a6b7c', msg: 'docs: update API reference',                  date: '4d ago' },
  { id: 'mc5',  hash: '8d9e0f1', msg: 'test: add auth integration tests',            date: '5d ago' },
  { id: 'mc6',  hash: '2g3h4i5', msg: "Merge branch 'hotfix/db-index'",              date: '6d ago',  isMerge: true, mergedBranch: 'hotfix/db-index' },
  { id: 'mc7',  hash: '6j7k8l9', msg: 'feat: add audit logging',                     date: '7d ago' },
  { id: 'mc8',  hash: '0m1n2o3', msg: 'feat: new schema structure',                  date: '8d ago' },
  { id: 'mc9',  hash: '4p5q6r7', msg: "Merge branch 'dev/schema-refactor'",          date: '10d ago', isMerge: true, mergedBranch: 'dev/schema-refactor' },
  { id: 'mc10', hash: '8s9t0u1', msg: 'chore: update dependencies',                  date: '11d ago' },
  { id: 'mc11', hash: 'v2w3x4y', msg: 'fix: connection pool timeout',                date: '12d ago' },
  { id: 'mc12', hash: '5z6a7b8', msg: 'perf: optimize query execution',              date: '13d ago' },
  { id: 'mc13', hash: 'c9d0e1f', msg: 'feat: initial schema design',                 date: '15d ago' },
  { id: 'mc14', hash: '2g3h4j6', msg: 'init: project bootstrap',                     date: '18d ago' },
]

const BRANCHES_DATA: BranchData[] = [
  {
    id: 'feature/bandwidth-ui', shortName: 'bandwidth-ui', color: '#f59e0b',
    forkFromMainIndex: 0, mergeIntoMainIndex: null, side: 'right', status: 'conflicts',
    commits: [
      { id: 'bw1', hash: 'bui001', msg: 'feat: bandwidth module init' },
      { id: 'bw2', hash: 'bui002', msg: 'feat: diff viewer component' },
      { id: 'bw3', hash: 'bui003', msg: 'feat: branch tree visualization' },
      { id: 'bw4', hash: 'bui004', msg: 'style: add bloom animations' },
      { id: 'bw5', hash: 'bui005', msg: 'fix: panel layout overflow' },
    ]
  },
  {
    id: 'feature/auth-v2', shortName: 'auth-v2', color: '#8b5cf6',
    forkFromMainIndex: 9, mergeIntoMainIndex: 1, side: 'right', status: 'merged',
    commits: [
      { id: 'au1', hash: 'aut001', msg: 'feat: JWT implementation' },
      { id: 'au2', hash: 'aut002', msg: 'feat: refresh tokens' },
      { id: 'au3', hash: 'aut003', msg: 'feat: role-based access' },
      { id: 'au4', hash: 'aut004', msg: 'fix: token validation bug' },
      { id: 'au5', hash: 'aut005', msg: 'test: auth unit tests' },
      { id: 'au6', hash: 'aut006', msg: 'feat: OAuth2 integration' },
      { id: 'au7', hash: 'aut007', msg: 'fix: session expiry' },
      { id: 'au8', hash: 'aut008', msg: 'chore: cleanup unused code' },
    ]
  },
  {
    id: 'fix/token-expiry', shortName: 'token-expiry', color: '#38bdf8',
    forkFromMainIndex: 6, mergeIntoMainIndex: 3, side: 'left', status: 'merged',
    commits: [
      { id: 'te1', hash: 'tok001', msg: 'fix: token TTL calculation' },
      { id: 'te2', hash: 'tok002', msg: 'test: expiry edge cases' },
    ]
  },
  {
    id: 'hotfix/db-index', shortName: 'db-index', color: '#ef4444',
    forkFromMainIndex: 8, mergeIntoMainIndex: 6, side: 'right', status: 'merged',
    commits: [
      { id: 'di1', hash: 'idx001', msg: 'fix: add missing user_meta index' },
      { id: 'di2', hash: 'idx002', msg: 'fix: composite key definition' },
      { id: 'di3', hash: 'idx003', msg: 'perf: index query optimization' },
    ]
  },
  {
    id: 'dev/schema-refactor', shortName: 'schema-refactor', color: '#10b981',
    forkFromMainIndex: 14, mergeIntoMainIndex: 9, side: 'left', status: 'merged',
    commits: [
      { id: 'sr1',  hash: 'sch001', msg: 'refactor: user_meta schema' },
      { id: 'sr2',  hash: 'sch002', msg: 'refactor: auth tables structure' },
      { id: 'sr3',  hash: 'sch003', msg: 'feat: composite indexes' },
      { id: 'sr4',  hash: 'sch004', msg: 'fix: FK constraint order' },
      { id: 'sr5',  hash: 'sch005', msg: 'feat: table partitioning' },
      { id: 'sr6',  hash: 'sch006', msg: 'refactor: remove deprecated cols' },
      { id: 'sr7',  hash: 'sch007', msg: 'test: migration scripts v2' },
      { id: 'sr8',  hash: 'sch008', msg: 'docs: ERD diagram update' },
      { id: 'sr9',  hash: 'sch009', msg: 'fix: NULL constraint handling' },
      { id: 'sr10', hash: 'sch010', msg: 'feat: audit timestamp columns' },
      { id: 'sr11', hash: 'sch011', msg: 'perf: vacuum analyze tuning' },
      { id: 'sr12', hash: 'sch012', msg: 'feat: soft delete pattern' },
      { id: 'sr13', hash: 'sch013', msg: 'fix: migration dependency order' },
      { id: 'sr14', hash: 'sch014', msg: 'test: rollback script tests' },
      { id: 'sr15', hash: 'sch015', msg: 'chore: version bump to 2.0' },
    ]
  },
]

const MOCK_FILES: MockFile[] = [
  {
    id: 'f1', path: 'schema/user_meta.sql', name: 'user_meta.sql',
    status: 'modified', additions: 8, deletions: 3, conflicts: 2,
    diff: [
      { leftNum: 1,  rightNum: 1,  kind: 'normal',  leftContent: 'CREATE TABLE user_meta (', rightContent: 'CREATE TABLE user_meta (' },
      { leftNum: 2,  rightNum: 2,  kind: 'normal',  leftContent: '  id UUID PRIMARY KEY,',   rightContent: '  id UUID PRIMARY KEY,' },
      { leftNum: 3,  rightNum: undefined, kind: 'removed', leftContent: "  role VARCHAR(20) DEFAULT 'user'," },
      { leftNum: undefined, rightNum: 3,  kind: 'added',   rightContent: "  role VARCHAR(50) DEFAULT 'member'," },
      { leftNum: 4,  rightNum: 4,  kind: 'normal',  leftContent: '  email VARCHAR(255) NOT NULL,', rightContent: '  email VARCHAR(255) NOT NULL,' },
      { leftNum: 5,  rightNum: undefined, kind: 'conflict-ours',   leftContent: '<<<<<<< HEAD' },
      { leftNum: 6,  rightNum: undefined, kind: 'conflict-ours',   leftContent: '  created_at TIMESTAMP DEFAULT now(),' },
      { leftNum: undefined, rightNum: 5,  kind: 'conflict-sep',    leftContent: '=======', rightContent: '=======' },
      { leftNum: undefined, rightNum: 6,  kind: 'conflict-theirs', rightContent: '  created_at TIMESTAMPTZ NOT NULL,' },
      { leftNum: undefined, rightNum: 7,  kind: 'conflict-theirs', rightContent: '  updated_at TIMESTAMPTZ,' },
      { leftNum: 7,  rightNum: 8,  kind: 'conflict-sep', leftContent: '>>>>>>> feature/auth-v2', rightContent: '>>>>>>> feature/auth-v2' },
      { leftNum: 8,  rightNum: 9,  kind: 'normal',  leftContent: '  is_active BOOLEAN DEFAULT true,', rightContent: '  is_active BOOLEAN DEFAULT true,' },
      { leftNum: 9,  rightNum: undefined, kind: 'conflict-ours',   leftContent: '<<<<<<< HEAD' },
      { leftNum: 10, rightNum: undefined, kind: 'conflict-ours',   leftContent: '  meta JSONB' },
      { leftNum: undefined, rightNum: 10, kind: 'conflict-sep',    leftContent: '=======', rightContent: '=======' },
      { leftNum: undefined, rightNum: 11, kind: 'conflict-theirs', rightContent: "  meta JSONB NOT NULL DEFAULT '{}'," },
      { leftNum: undefined, rightNum: 12, kind: 'conflict-theirs', rightContent: '  audit_log TEXT[]' },
      { leftNum: 11, rightNum: 13, kind: 'conflict-sep', leftContent: '>>>>>>> feature/auth-v2', rightContent: '>>>>>>> feature/auth-v2' },
      { leftNum: 12, rightNum: 14, kind: 'normal',  leftContent: ');', rightContent: ');' },
    ]
  },
  {
    id: 'f2', path: 'auth/tokens_v2.go', name: 'tokens_v2.go',
    status: 'added', additions: 24, deletions: 0, conflicts: 0,
    diff: [
      { kind: 'added', rightNum: 1, rightContent: 'package auth' },
      { kind: 'added', rightNum: 2, rightContent: '' },
      { kind: 'added', rightNum: 3, rightContent: 'import (' },
      { kind: 'added', rightNum: 4, rightContent: '  "crypto/rand"' },
      { kind: 'added', rightNum: 5, rightContent: '  "encoding/hex"' },
      { kind: 'added', rightNum: 6, rightContent: '  "time"' },
      { kind: 'added', rightNum: 7, rightContent: ')' },
      { kind: 'added', rightNum: 8, rightContent: '' },
      { kind: 'added', rightNum: 9, rightContent: 'type Token struct {' },
      { kind: 'added', rightNum: 10, rightContent: '  Value     string' },
      { kind: 'added', rightNum: 11, rightContent: '  ExpiresAt time.Time' },
      { kind: 'added', rightNum: 12, rightContent: '  Scope     []string' },
      { kind: 'added', rightNum: 13, rightContent: '}' },
      { kind: 'added', rightNum: 14, rightContent: '' },
      { kind: 'added', rightNum: 15, rightContent: 'func NewToken(ttl time.Duration) (*Token, error) {' },
      { kind: 'added', rightNum: 16, rightContent: '  b := make([]byte, 32)' },
      { kind: 'added', rightNum: 17, rightContent: '  if _, err := rand.Read(b); err != nil {' },
      { kind: 'added', rightNum: 18, rightContent: '    return nil, err' },
      { kind: 'added', rightNum: 19, rightContent: '  }' },
      { kind: 'added', rightNum: 20, rightContent: '  return &Token{ Value: hex.EncodeToString(b), ExpiresAt: time.Now().Add(ttl) }, nil' },
      { kind: 'added', rightNum: 21, rightContent: '}' },
    ]
  },
  {
    id: 'f3', path: 'legacy/old_sync.sh', name: 'old_sync.sh',
    status: 'deleted', additions: 0, deletions: 9, conflicts: 0,
    diff: [
      { kind: 'removed', leftNum: 1, leftContent: '#!/bin/bash' },
      { kind: 'removed', leftNum: 2, leftContent: '# Legacy sync — DO NOT USE' },
      { kind: 'removed', leftNum: 3, leftContent: '' },
      { kind: 'removed', leftNum: 4, leftContent: 'DB_HOST="localhost"' },
      { kind: 'removed', leftNum: 5, leftContent: 'DB_PORT=5432' },
      { kind: 'removed', leftNum: 6, leftContent: '' },
      { kind: 'removed', leftNum: 7, leftContent: 'echo "Syncing legacy schema..."' },
      { kind: 'removed', leftNum: 8, leftContent: 'psql -h $DB_HOST -p $DB_PORT -c "SELECT sync_v1();"' },
      { kind: 'removed', leftNum: 9, leftContent: 'if [ $? -ne 0 ]; then echo "ERROR: sync failed"; fi' },
    ]
  }
]

// ══════════════════════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════════════════════
function lineStyle(k: LineKind): React.CSSProperties {
  if (k === 'added')           return { background: 'rgba(16,185,129,0.1)',  borderLeft: '3px solid #10b981' }
  if (k === 'removed')         return { background: 'rgba(239,68,68,0.1)',   borderLeft: '3px solid #ef4444' }
  if (k === 'conflict-ours')   return { background: 'rgba(245,158,11,0.13)', borderLeft: '3px solid #f59e0b' }
  if (k === 'conflict-theirs') return { background: 'rgba(139,92,246,0.12)', borderLeft: '3px solid #8b5cf6' }
  if (k === 'conflict-sep')    return { background: 'rgba(100,116,139,0.12)',borderLeft: '3px solid #64748b' }
  return { borderLeft: '3px solid transparent' }
}
function lineGlyph(k: LineKind) {
  if (k === 'added')    return <span style={{ color:'#10b981', marginRight:'6px', fontSize:'12px', fontFamily:'monospace' }}>+</span>
  if (k === 'removed')  return <span style={{ color:'#ef4444', marginRight:'6px', fontSize:'12px', fontFamily:'monospace' }}>−</span>
  if (k.startsWith('conflict')) return <span style={{ color:'#f59e0b', marginRight:'6px', fontSize:'10px' }}>⚡</span>
  return <span style={{ marginRight:'6px', width:'12px', display:'inline-block' }} />
}
function numStyle(k: LineKind): React.CSSProperties {
  const base: React.CSSProperties = { minWidth:'38px', textAlign:'right', paddingRight:'10px', paddingLeft:'4px', fontSize:'11px', fontFamily:'monospace', userSelect:'none', color:'#475569', flexShrink:0 }
  if (k === 'added')           return { ...base, color:'#10b981' }
  if (k === 'removed')         return { ...base, color:'#ef4444' }
  if (k.startsWith('conflict'))return { ...base, color:'#f59e0b' }
  return base
}

// ══════════════════════════════════════════════════════════════════
// Branch Tree Canvas
// ══════════════════════════════════════════════════════════════════
function BranchTreeCanvas({
  selectedBranch, setSelectedBranch, setBwTab, selectedCommit, setSelectedCommit
}: { 
  selectedBranch: string | null; 
  setSelectedBranch: (id: string | null) => void; 
  setBwTab?: (t: BwTab) => void;
  selectedCommit: MainCommit | BranchCommit | null;
  setSelectedCommit: (c: MainCommit | BranchCommit | null) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null)
  const [hoveredDot, setHoveredDot] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const svgHeight = TOP_PAD + MAIN_COMMITS.length * COMMIT_SPACING + 80

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(t)
  }, [])

  const activeBranch = hovered || selectedBranch

  return (
    <div className="bw-tree-canvas">
      {/* Canvas sub-header */}
      <div className="bw-tree-subheader">
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <GitBranch size={14} style={{ color:'var(--accent-purple)' }} />
          <span style={{ fontSize:'12px', fontWeight:700, color:'var(--text-primary)' }}>Branch Network</span>
          <span style={{ fontSize:'10px', color:'#475569', fontFamily:'monospace' }}>main @ 7f2a1b9</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
          <span style={{ fontSize:'10px', color:'#475569' }}>
            {MAIN_COMMITS.length} commits · {BRANCHES_DATA.length} branches
          </span>
          <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#10b981', boxShadow:'0 0 6px #10b981' }} />
          <span style={{ fontSize:'10px', color:'#10b981' }}>1 active</span>
        </div>
      </div>

      {/* Selected commit info */}
      {selectedCommit && (
        <div className="bw-commit-popup">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'6px' }}>
            <span style={{ fontFamily:'monospace', fontSize:'11px', color:'var(--accent-blue)' }}>{selectedCommit.hash}</span>
            <button style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer', display:'flex' }} onClick={() => setSelectedCommit(null)}>
              <X size={12} />
            </button>
          </div>
          <p style={{ fontSize:'12px', color:'var(--text-primary)', margin:'0 0 4px' }}>{selectedCommit.msg}</p>
          <span style={{ fontSize:'10px', color:'#475569' }}>{'date' in selectedCommit ? selectedCommit.date : 'Just now'}</span>
          {'isMerge' in selectedCommit && selectedCommit.isMerge && (
            <span style={{ marginLeft:'8px', fontSize:'9px', background:'rgba(139,92,246,0.2)', color:'#a78bfa', padding:'1px 6px', borderRadius:'4px', fontWeight:700 }}>MERGE</span>
          )}
        </div>
      )}

      {/* SVG Tree */}
      <div className="bw-tree-scroll">
        <svg
          width={SVG_WIDTH}
          height={svgHeight}
          style={{ display:'block', minWidth: SVG_WIDTH }}
        >
          <defs>
            <linearGradient id="trunkGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#38bdf8" />
              <stop offset="45%"  stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glowSoft" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* ── Trunk ── */}
          <line
            x1={TRUNK_X} y1={TOP_PAD - 10}
            x2={TRUNK_X} y2={svgHeight - 30}
            stroke="url(#trunkGrad)"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* ── HEAD pulse ring ── */}
          <circle cx={TRUNK_X} cy={TOP_PAD} r={14} fill="none" stroke="#38bdf8" strokeWidth="1" opacity="0.3" className="bw-head-ring" />
          <circle cx={TRUNK_X} cy={TOP_PAD} r={20} fill="none" stroke="#38bdf8" strokeWidth="0.5" opacity="0.15" className="bw-head-ring-2" />

          {/* ── Branches ── */}
          {BRANCHES_DATA.map((br, bIdx) => {
            const isActive = activeBranch === br.id
            const { tipX, tipY, dots, paths, stemPath } = getOrganicBranchData(
              br.forkFromMainIndex, br.commits.length, br.side, isActive, br.id
            )
            const shouldBloom = br.commits.length >= 5
            const growDelay = bIdx * 0.18

            return (
              <g
                key={br.id}
                onMouseEnter={() => setHovered(br.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setSelectedBranch(selectedBranch === br.id ? null : br.id)}
                style={{ cursor: 'pointer' }}
              >
                {/* Glow halo when active (only on main stem) */}
                {isActive && (
                  <path
                    d={stemPath}
                    stroke={br.color}
                    strokeWidth="8"
                    fill="none"
                    opacity="0.15"
                    strokeLinecap="round"
                  />
                )}

                {/* Branch paths (stem + organic branches) */}
                {paths.map((p, idx) => (
                  <path
                    key={idx}
                    d={p}
                    stroke={br.color}
                    strokeWidth={isActive ? (idx === 0 ? 2.5 : 1.5) : 1.8}
                    fill="none"
                    strokeLinecap="round"
                    opacity={activeBranch && !isActive ? 0.3 : isActive ? 1 : 0.75}
                    style={{
                      strokeDasharray: idx === 0 ? 600 : 100,
                      strokeDashoffset: mounted ? 0 : (idx === 0 ? 600 : 100),
                      transition: `stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1) ${growDelay + idx * 0.05}s, opacity 0.2s, stroke-width 0.2s`
                    }}
                  />
                ))}

                {/* Commit dots along the branch */}
                {dots.map((pos, i) => {
                  const commit = br.commits[pos.idx]
                  const isSelCommit = selectedCommit?.id === commit?.id
                  const isHovered = hoveredDot === commit?.id
                  return (
                    <g 
                      key={i} 
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedCommit(commit)
                        if (setBwTab) setBwTab('commits')
                      }}
                      onMouseEnter={() => setHoveredDot(commit?.id ?? null)}
                      onMouseLeave={() => setHoveredDot(null)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Transparent Hitbox for easy clicking */}
                      <circle cx={pos.x} cy={pos.y} r={16} fill="transparent" />
                      
                      {(isActive || isHovered) && (
                        <circle cx={pos.x} cy={pos.y} r={isSelCommit ? 11 : isHovered ? 9 : 7} fill={br.color} opacity={isSelCommit ? 0.3 : isHovered ? 0.25 : 0.12} style={{ transition: 'r 0.2s, opacity 0.2s' }} />
                      )}
                      
                      {isActive && commit?.hash && (
                        <text
                          x={pos.x + 12}
                          y={pos.y + 3}
                          fontSize="9"
                          fill={isSelCommit || isHovered ? "#e2e8f0" : "#64748b"}
                          fontFamily='"SF Mono", monospace'
                          style={{ pointerEvents: 'none', transition: 'fill 0.2s' }}
                        >
                          {commit.hash.substring(0, 7)}
                        </text>
                      )}

                      <circle
                        cx={pos.x} cy={pos.y} r={isActive ? (pos.isTip ? (isSelCommit ? 6 : isHovered ? 5 : 4) : (isSelCommit ? 5 : isHovered ? 4 : 3)) : 4}
                        fill={br.color}
                        opacity={activeBranch && !isActive ? 0.25 : 0.9}
                        stroke={isSelCommit || isHovered ? "#fff" : undefined}
                        strokeWidth={isSelCommit ? 1.5 : 0}
                        style={{
                          transition: `opacity 0.2s, r 0.2s, cx 0.4s cubic-bezier(0.34,1.56,0.64,1), cy 0.4s cubic-bezier(0.34,1.56,0.64,1)`,
                          transitionDelay: mounted ? `${growDelay + 0.5 + i * 0.04}s` : '0s'
                        }}
                      />
                    </g>
                  )
                })}

                {/* Bloom petals at tip (for 5+ commits) */}
                {shouldBloom && (
                  <g>
                    {Array.from({ length: 8 }, (_, i) => {
                      const angle = (i / 8) * Math.PI * 2
                      const r = isActive ? 14 : 10
                      const px = tipX + r * Math.cos(angle)
                      const py = tipY + r * Math.sin(angle)
                      return (
                        <circle
                          key={i}
                          cx={px}
                          cy={py}
                          r={isActive ? 4 : 2.5}
                          fill={br.color}
                          opacity={isActive ? 0.65 : 0.2}
                          style={{
                            transition: `r 0.5s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.03}s, opacity 0.3s ${i * 0.03}s`
                          }}
                        />
                      )
                    })}
                    {/* Tip center dot */}
                    <circle
                      cx={tipX} cy={tipY}
                      r={isActive ? 6 : 4}
                      fill={br.color}
                      opacity={isActive ? 1 : 0.6}
                      filter={isActive ? 'url(#glowSoft)' : undefined}
                      style={{ transition: 'r 0.3s, opacity 0.3s' }}
                    />
                    {/* Extra outer ring when blooming */}
                    {isActive && (
                      <circle
                        cx={tipX} cy={tipY} r={24}
                        fill="none" stroke={br.color}
                        strokeWidth="1" opacity="0.25"
                        className="bw-bloom-outer-ring"
                      />
                    )}
                  </g>
                )}

                {/* Branch label */}
                <text
                  x={tipX + (br.side === 'right' ? 12 : -12)}
                  y={tipY + 4}
                  fontSize="11"
                  fill={br.color}
                  fontFamily="'SF Mono', 'Fira Code', monospace"
                  fontWeight={isActive ? '700' : '500'}
                  textAnchor={br.side === 'right' ? 'start' : 'end'}
                  opacity={activeBranch && !isActive ? 0.3 : 1}
                  style={{ transition: 'opacity 0.2s' }}
                >
                  {br.shortName}
                </text>

                {/* Status indicator next to label */}
                {br.status === 'active' && (
                  <circle
                    cx={br.side === 'right'
                      ? tipX + 14 + br.shortName.length * 6.5
                      : tipX - 14 - br.shortName.length * 6.5 - 8}
                    cy={tipY}
                    r={3}
                    fill="#10b981"
                    className="bw-active-dot"
                  />
                )}

                {/* Commit count badge */}
                <text
                  x={tipX + (br.side === 'right' ? 12 : -12)}
                  y={tipY + 16}
                  fontSize="9"
                  fill="#475569"
                  fontFamily="monospace"
                  textAnchor={br.side === 'right' ? 'start' : 'end'}
                  opacity={activeBranch && !isActive ? 0.2 : 0.7}
                >
                  {br.commits.length} commit{br.commits.length !== 1 ? 's' : ''} · {br.status}
                </text>
              </g>
            )
          })}

          {/* ── Main commits ── */}
          {MAIN_COMMITS.map((commit, idx) => {
            const y = cY(idx)
            const isHead = idx === 0
            const isSel = selectedCommit?.id === commit.id
            return (
              <g
                key={commit.id}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedCommit(commit)
                  if (setBwTab) setBwTab('commits')
                }}
                style={{ cursor: 'pointer' }}
              >
                {/* Commit halo */}
                {(isSel || isHead) && (
                  <circle
                    cx={TRUNK_X} cy={y}
                    r={commit.isMerge ? 14 : 11}
                    fill={commit.isMerge ? 'rgba(139,92,246,0.15)' : 'rgba(56,189,248,0.12)'}
                  />
                )}

                {/* Main commit dot */}
                <circle
                  cx={TRUNK_X} cy={y}
                  r={commit.isMerge ? 8 : isHead ? 7 : 5}
                  fill={commit.isMerge ? '#1a0f2e' : isHead ? '#0f1623' : '#0d1117'}
                  stroke={commit.isMerge ? '#a78bfa' : isHead ? '#38bdf8' : '#334155'}
                  strokeWidth={isSel ? 2.5 : commit.isMerge ? 2 : 1.5}
                  filter={isHead ? 'url(#glow)' : undefined}
                />

                {/* HEAD label */}
                {isHead && (
                  <text x={TRUNK_X - 14} y={y + 4} fontSize="9" fill="#38bdf8" fontFamily="monospace" textAnchor="end" fontWeight="700">
                    HEAD
                  </text>
                )}

                {/* Commit hash */}
                <text
                  x={TRUNK_X + 16} y={y + 4}
                  fontSize="10"
                  fill={commit.isMerge ? '#a78bfa' : '#475569'}
                  fontFamily="'SF Mono', monospace"
                >
                  {commit.hash}
                </text>

                {/* Commit message */}
                <text
                  x={TRUNK_X + 72} y={y + 4}
                  fontSize="11.5"
                  fill={isSel ? '#e2e8f0' : commit.isMerge ? '#94a3b8' : '#64748b'}
                  fontFamily="Inter, -apple-system, sans-serif"
                >
                  {commit.msg.length > 48 ? commit.msg.slice(0, 48) + '…' : commit.msg}
                </text>

                {/* Date */}
                <text
                  x={TRUNK_X + 72 + 310} y={y + 4}
                  fontSize="10"
                  fill="#334155"
                  fontFamily="monospace"
                >
                  {commit.date}
                </text>

                {/* Merge badge */}
                {commit.isMerge && (
                  <>
                    <rect
                      x={TRUNK_X + 72 + 310 + 50} y={y - 7}
                      width={46} height={13}
                      rx={4}
                      fill="rgba(139,92,246,0.18)"
                      stroke="rgba(139,92,246,0.35)"
                      strokeWidth={0.5}
                    />
                    <text
                      x={TRUNK_X + 72 + 310 + 73} y={y + 3}
                      fontSize="8.5" fill="#a78bfa" textAnchor="middle" fontWeight="700" fontFamily="monospace" letterSpacing="0.04em"
                    >
                      MERGE
                    </text>
                  </>
                )}
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// BW Overview (Diff Viewer)
// ══════════════════════════════════════════════════════════════════
function BwOverview({ selectedBranch }: { selectedBranch: string | null }) {
  const [openTabs, setOpenTabs] = useState<string[]>([MOCK_FILES[0].id])
  const [activeFileId, setActiveFileId] = useState(MOCK_FILES[0].id)
  const [diffMode, setDiffMode] = useState<DiffMode>('split')
  const [copied, setCopied] = useState(false)

  const file = MOCK_FILES.find(f => f.id === activeFileId)!
  const openFile = (id: string) => {
    setActiveFileId(id)
    if (!openTabs.includes(id)) setOpenTabs(p => [...p, id])
  }
  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const next = openTabs.filter(t => t !== id)
    setOpenTabs(next)
    if (activeFileId === id) setActiveFileId(next[0] ?? MOCK_FILES[0].id)
  }

  const compareBranch = selectedBranch
    ? BRANCHES_DATA.find(b => b.id === selectedBranch)?.shortName ?? 'feature/auth-v2'
    : 'feature/auth-v2'

  return (
    <div className="bw-overview-area">
      {/* File tabs header */}
      <div className="bw-diff-header">
        <div className="bw-tabs">
          {openTabs.map(tid => {
            const f = MOCK_FILES.find(x => x.id === tid)
            if (!f) return null
            return (
              <div key={tid} className={`bw-tab ${activeFileId === tid ? 'active' : ''}`} onClick={() => setActiveFileId(tid)}>
                <span className="bw-tab-ext">.{f.name.split('.').pop()}</span>
                <span className="bw-tab-name">{f.name}</span>
                {f.conflicts > 0 && <span style={{ color:'#f59e0b', fontSize:'10px' }}>⚡</span>}
                <button className="bw-tab-close" onClick={e => closeTab(tid, e)}><X size={10} /></button>
              </div>
            )
          })}
          {MOCK_FILES.filter(f => !openTabs.includes(f.id)).map(f => (
            <div key={f.id} className="bw-tab-hint" onClick={() => openFile(f.id)}>
              + {f.name}
            </div>
          ))}
        </div>
        <div className="bw-diff-actions">
          <div className="bw-mode-toggle">
            <button className={`bw-mode-btn ${diffMode === 'split' ? 'active' : ''}`} onClick={() => setDiffMode('split')}><Columns size={11} /> Split</button>
            <button className={`bw-mode-btn ${diffMode === 'unified' ? 'active' : ''}`} onClick={() => setDiffMode('unified')}><AlignLeft size={11} /> Unified</button>
          </div>
          <button className="icon-btn" onClick={() => { navigator.clipboard.writeText(file.path); setCopied(true); setTimeout(() => setCopied(false), 2000) }}>
            {copied ? <Check size={12} style={{ color:'#10b981' }} /> : <Copy size={12} />}
          </button>
        </div>
      </div>

      {/* File title bar */}
      <div className="bw-file-titlebar">
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <span className="bw-filepath">{file.path}</span>
          {file.status === 'added'    && <span className="bw-badge added">NUEVO</span>}
          {file.status === 'deleted'  && <span className="bw-badge deleted">ELIMINADO</span>}
          {file.status === 'modified' && <span className="bw-badge modified">MODIFICADO</span>}
        </div>
        <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
          {file.additions > 0 && <span style={{ fontSize:'11px', fontFamily:'monospace', fontWeight:700, color:'#10b981' }}>+{file.additions}</span>}
          {file.deletions > 0 && <span style={{ fontSize:'11px', fontFamily:'monospace', fontWeight:700, color:'#ef4444' }}>−{file.deletions}</span>}
          {file.conflicts > 0 && <span style={{ fontSize:'11px', fontFamily:'monospace', fontWeight:700, color:'#f59e0b', display:'flex', alignItems:'center', gap:'3px' }}><Zap size={10} />{file.conflicts}</span>}
        </div>
      </div>

      {/* Diff */}
      <div className="bw-diff-container">
        {diffMode === 'split' && (
          <>
            <div className="bw-diff-col-headers">
              <div className="bw-col-header left"><GitBranch size={11} /> main</div>
              <div className="bw-col-header right"><GitBranch size={11} style={{ color:'var(--accent-purple)' }} /> {compareBranch}</div>
            </div>
            <div className="bw-diff-lines">
              {file.diff.map((line, i) => (
                <div key={i} className="bw-diff-row" style={lineStyle(line.kind)}>
                  <div className="bw-diff-side left">
                    <span style={numStyle(line.kind)}>{line.leftNum ?? ''}</span>
                    {line.kind !== 'added' && (
                      <span className="bw-diff-code">{lineGlyph(line.kind)}<span style={{ fontFamily:'monospace', fontSize:'12.5px', whiteSpace:'pre' }}>{line.leftContent ?? ''}</span></span>
                    )}
                  </div>
                  <div className="bw-diff-divider" style={{ background: line.kind.startsWith('conflict') ? 'rgba(245,158,11,0.18)' : undefined }} />
                  <div className="bw-diff-side right">
                    <span style={numStyle(line.kind)}>{line.rightNum ?? ''}</span>
                    {line.kind !== 'removed' && (
                      <span className="bw-diff-code">{lineGlyph(line.kind)}<span style={{ fontFamily:'monospace', fontSize:'12.5px', whiteSpace:'pre' }}>{line.rightContent ?? ''}</span></span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {diffMode === 'unified' && (
          <div className="bw-diff-lines">
            {file.diff.map((line, i) => {
              const content = line.kind === 'added' ? line.rightContent : (line.leftContent ?? line.rightContent ?? '')
              return (
                <div key={i} className="bw-diff-row unified" style={lineStyle(line.kind)}>
                  <span style={{ ...numStyle(line.kind), minWidth:'28px' }}>{line.kind === 'added' ? '' : (line.leftNum ?? '')}</span>
                  <span style={{ ...numStyle(line.kind), minWidth:'28px' }}>{line.kind === 'removed' ? '' : (line.rightNum ?? '')}</span>
                  <span className="bw-diff-code" style={{ flex:1 }}>{lineGlyph(line.kind)}<span style={{ fontFamily:'monospace', fontSize:'12.5px', whiteSpace:'pre' }}>{content}</span></span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// Commit List View
// ══════════════════════════════════════════════════════════════════
function CommitListView({ 
  selectedBranch, 
  selectedCommit,
  setSelectedCommit
}: { 
  selectedBranch: string | null, 
  selectedCommit: MainCommit | BranchCommit | null,
  setSelectedCommit: (c: MainCommit | BranchCommit | null) => void
}) {
  const branchData = BRANCHES_DATA.find(b => b.id === selectedBranch)
  const commitsToShow = branchData ? branchData.commits : MAIN_COMMITS

  return (
    <div className="bw-commits-container" style={{ padding: '24px 32px', overflowY: 'auto', height: '100%', background: 'transparent' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <h2 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '20px', fontWeight: 600 }}>Commits</h2>
        {branchData && (
          <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>
            {branchData.shortName}
          </span>
        )}
      </div>
      
      <div className="commits-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '900px' }}>
        {commitsToShow.map(c => {
          const isSelected = selectedCommit?.id === c.id;
          return (
            <div key={c.id} className="commit-list-item" 
              onClick={() => setSelectedCommit(isSelected ? null : c)}
              style={{ 
              background: '#0d1117', 
              padding: '16px', 
              borderRadius: '6px', 
              border: `1px solid ${isSelected ? 'var(--accent-blue)' : '#30363d'}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              position: 'relative',
              cursor: 'pointer'
            }}>
              {isSelected && (
                <div style={{ position: 'absolute', left: '-1px', top: '50%', transform: 'translateY(-50%)', width: '3px', height: 'calc(100% - 16px)', background: 'var(--accent-blue)', borderRadius: '0 4px 4px 0' }} />
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontWeight: 600, color: '#e6edf3', fontSize: '14px', fontFamily: 'Inter, sans-serif' }}>{c.msg}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#8b949e' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px', fontWeight: 'bold' }}>
                      K
                    </div>
                    <span>
                      <span style={{ color: '#e6edf3', fontWeight: 500 }}>kiro-developer</span> committed {'date' in c ? (c as MainCommit).date : 'just now'}
                    </span>
                    {'isMerge' in c && (c as MainCommit).isMerge && (
                      <span style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', padding: '1px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 600 }}>MERGE</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontFamily: '"SF Mono", monospace', fontSize: '12px', color: '#8b949e' }}>{c.hash}</span>
                  <button style={{ 
                    background: '#21262d', 
                    border: '1px solid #30363d', 
                    borderRadius: '6px', 
                    padding: '4px 8px', 
                    color: '#c9d1d9', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#8b949e'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#30363d'}
                  >
                    <Code size={14} />
                  </button>
                </div>
              </div>
              
              {/* Resumen de lo nuevo */}
              {isSelected && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #30363d' }}>
                  <h4 style={{ color: '#e2e8f0', fontSize: '12px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={12} style={{ color: 'var(--accent-blue)' }} /> 
                    Resumen de lo nuevo
                  </h4>
                  <div style={{ background: '#161b22', padding: '12px', borderRadius: '4px', fontSize: '11px', fontFamily: '"SF Mono", monospace', color: '#8b949e', border: '1px solid #30363d' }}>
                    <div style={{ color: '#10b981' }}>+ added {Math.floor(Math.random() * 5) + 1} new files</div>
                    <div style={{ color: '#ef4444' }}>- deleted {Math.floor(Math.random() * 2)} old schemas</div>
                    <div style={{ color: '#e2e8f0', marginTop: '8px', fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
                      Se modificaron las tablas para reflejar los cambios solicitados en: <strong>{c.msg}</strong>.<br/>
                      Las validaciones de servidor también han sido actualizadas.
                    </div>
                  </div>
                </div>
              )}

            </div>
          )
        })}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════════════
export function BandwidthSidebar({ 
  bwTab, 
  setBwTab, 
  selectedBranch, 
  setSelectedBranch,
  onNavigateHome
}: {
  bwTab: BwTab;
  setBwTab: (tab: BwTab) => void;
  selectedBranch: string | null;
  setSelectedBranch: (branch: string | null) => void;
  onNavigateHome: () => void;
}) {
  const totalConflicts = MOCK_FILES.reduce((a, f) => a + f.conflicts, 0)
  const currentBranch = selectedBranch ? BRANCHES_DATA.find(b => b.id === selectedBranch) : null;

  return (
    <div className="left-sidebar" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'transparent', borderRight: 'none' }}>
      
      {/* Header */}
      <div className="master-sidebar-logo-group" style={{ cursor: 'pointer', borderBottom: '1px solid #131924' }} onClick={onNavigateHome}>
        <ArrowLeft size={16} style={{ color: '#94a3b8', marginRight: '8px' }} />
        <div className="master-logo-text-group">
          <span className="master-logo-text" style={{ fontSize: '13px' }}>Bandwidth</span>
          <span className="master-logo-sub">branch network</span>
        </div>
      </div>

      <div className="sidebar-top" style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>

        {/* Explorer card */}
        <div className="explorer-card" style={{ 
          marginBottom: '8px', 
          border: currentBranch?.status === 'conflicts' ? '1px solid rgba(245,158,11,0.3)' : undefined 
        }}>
          <div className="explorer-icon-wrapper" style={{ 
            background: currentBranch?.status === 'conflicts' ? 'rgba(245,158,11,0.1)' : undefined,
            color: currentBranch?.status === 'conflicts' ? '#f59e0b' : undefined
          }}>
            <GitBranch size={16} />
          </div>
          <div className="explorer-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1 }}>
            <div>
              <h3>Branch Explorer</h3>
              <p>{currentBranch ? `${currentBranch.shortName} @ ${currentBranch.commits[currentBranch.commits.length-1].hash}` : 'main @ 7f2a1b9'}</p>
            </div>
            {currentBranch?.status === 'conflicts' && (
              <AlertTriangle size={16} color="#f59e0b" style={{ marginLeft: '8px', flexShrink: 0 }} />
            )}
          </div>
        </div>

        {/* Action buttons */}
        <button className="btn-new-table" onClick={() => { setBwTab('tree'); setSelectedBranch(null) }}>
          <Plus size={14} />
          COMPARE BRANCHES
        </button>

        {/* Sub-nav */}
        <div className="sidebar-menu" style={{ padding: 0, marginTop: '12px' }}>
          <div
            className={`menu-item ${bwTab === 'home' ? 'active' : ''}`}
            onClick={() => setBwTab('home')}
          >
            <Activity size={14} />
            OVERVIEW
          </div>
          <div
            className={`menu-item ${bwTab === 'tree' ? 'active' : ''}`}
            onClick={() => setBwTab('tree')}
          >
            <GitBranch size={14} />
            BRANCH TREE
          </div>
        </div>

        {/* Branch list */}
        <div className="sidebar-content-area" style={{ maxHeight: '300px', overflowY: 'auto' }}>
          <span className="sidebar-list-title">Ramas ({BRANCHES_DATA.length})</span>
          {BRANCHES_DATA.map(br => (
            <div
              key={br.id}
              className={`sidebar-list-item ${selectedBranch === br.id ? 'selected' : ''}`}
              onClick={() => {
                setSelectedBranch(selectedBranch === br.id ? null : br.id)
                setBwTab('tree')
              }}
            >
              <span className="sidebar-item-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: br.color, fontSize: '12px' }}>●</span>
                {br.shortName}
                {br.status === 'conflicts' && (
                  <AlertTriangle size={11} color="#f59e0b" />
                )}
              </span>
              <span className="sidebar-item-meta">{br.commits.length}c</span>
            </div>
          ))}
        </div>

        {/* Conflict summary */}
        {currentBranch?.status === 'conflicts' && totalConflicts > 0 && (
          <div className="sidebar-content-area" style={{ border: '1px solid rgba(245, 158, 11, 0.2)', background: 'rgba(245, 158, 11, 0.05)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '8px' }}>
              <span className="sidebar-list-title" style={{ color: '#f59e0b', margin: 0 }}>⚡ CONFLICTOS CON MAIN</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Los siguientes archivos chocan con main:</span>
            </div>
            {MOCK_FILES.filter(f => f.conflicts > 0).map(f => (
              <div key={f.id} className="sidebar-list-item" onClick={() => setBwTab('home')}>
                <span className="sidebar-item-name" style={{ fontSize: '11px', color: '#f87171' }}>
                  <AlertTriangle size={11} style={{ marginRight: '6px' }} />
                  {f.name}
                </span>
                <span className="sidebar-item-meta" style={{ color: '#f87171', fontSize: '10px' }}>{f.conflicts} conf</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="master-sidebar-footer" style={{ borderTop: '1px solid #131924' }}>
        <div className="master-footer-item">
          <FileText size={13} /><span>DOCS</span>
        </div>
        <div className="master-footer-item">
          <GitMerge size={13} /><span>PR</span>
        </div>
      </div>
    </div>
  )
}

export function BandwidthView({ bwTab, setBwTab, selectedBranch, setSelectedBranch }: { bwTab: BwTab, setBwTab?: (t: BwTab) => void, selectedBranch: string | null, setSelectedBranch: (id: string | null) => void }) {
  const [selectedCommit, setSelectedCommit] = useState<MainCommit | BranchCommit | null>(null)

  return (
    <div className="blueprint-designer-workspace-wrapper">
      
      {/* ══ Top Sub-header (Blueprint-style) ══ */}
      <div className="blueprint-sub-header">
        <div className="sub-header-left">
          <span className="workspace-title-label">Bandwidth / branch network</span>
        </div>
        <div className="sub-header-right">
          {/* Action buttons can go here in the future */}
        </div>
      </div>

      <div className="workspace-body" style={{ height: 'calc(100% - 48px)', display: 'flex' }}>
        <div className="bw-right-content" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {bwTab === 'tree' && (
            <BranchTreeCanvas
              selectedBranch={selectedBranch}
              setSelectedBranch={setSelectedBranch}
              setBwTab={setBwTab}
              selectedCommit={selectedCommit}
              setSelectedCommit={setSelectedCommit}
            />
          )}
          {bwTab === 'home' && (
            <BwOverview selectedBranch={selectedBranch} />
          )}
          {bwTab === 'commits' && (
            <CommitListView 
              selectedBranch={selectedBranch} 
              selectedCommit={selectedCommit} 
              setSelectedCommit={setSelectedCommit}
            />
          )}
        </div>
      </div>
    </div>
  )
}
