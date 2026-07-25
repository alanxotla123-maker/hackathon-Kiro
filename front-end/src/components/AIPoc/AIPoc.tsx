import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  FileCode,
  Wand2,
  ArrowLeft,
  Loader2,
  Sparkles,
  FolderSearch,
  ChevronRight,
  FolderOpen,
  Folder,
} from 'lucide-react';
import './AIPoc.css';

// ─── Config ──────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:3000/api';

interface AIPocProps {
  onBack: () => void;
}

interface ScannedFile {
  filepath: string;
  content: string;
}

interface Review {
  linea: number;
  tipo: string;
  sugerencia: string;
}

// ─── Group files into a folder tree for the sidebar ──────────────────
interface FolderNode {
  [key: string]: FolderNode | null; // null = leaf (file)
}

function buildTree(files: ScannedFile[]): FolderNode {
  const tree: FolderNode = {};
  for (const f of files) {
    const parts = f.filepath.split('/');
    let current = tree;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        current[part] = null; // file
      } else {
        if (!current[part] || current[part] === null) {
          current[part] = {};
        }
        current = current[part] as FolderNode;
      }
    }
  }
  return tree;
}

const AIPoc: React.FC<AIPocProps> = ({ onBack }) => {
  const [scannedFiles, setScannedFiles] = useState<ScannedFile[]>([]);
  const [totalFiles, setTotalFiles] = useState(0);
  const [selectedFile, setSelectedFile] = useState<ScannedFile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewMarkdown, setReviewMarkdown] = useState('');
  const [loadingScan, setLoadingScan] = useState(false);
  const [loadingReview, setLoadingReview] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // ── Scan directories ──
  const scanDirectories = async () => {
    setLoadingScan(true);
    setSelectedFile(null);
    setReviews([]);
    setReviewMarkdown('');

    try {
      const res = await fetch(`${API_BASE}/doc-generator/scan`);
      const data = await res.json();
      setScannedFiles(data.files || []);
      setTotalFiles(data.totalFiles || 0);

      // Auto-expand top-level folders
      const topFolders = new Set<string>();
      for (const f of data.files || []) {
        const first = f.filepath.split('/')[0];
        topFolders.add(first);
      }
      setExpandedFolders(topFolders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingScan(false);
    }
  };

  // ── Select a file and auto-send to code review ──
  const selectAndReview = async (file: ScannedFile) => {
    setSelectedFile(file);
    setLoadingReview(true);
    setReviews([]);
    setReviewMarkdown('');

    try {
      const res = await fetch(`${API_BASE}/code-review/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: file.content }),
      });
      const data = await res.json();

      if (data.reviews && Array.isArray(data.reviews)) {
        setReviews(data.reviews);

        const fileName = file.filepath.split('/').pop() || file.filepath;
        const md = [
          `## 🔍 Code Review: \`${fileName}\``,
          '',
          `Se encontraron **${data.reviews.length}** observaciones.`,
          '',
          '| Línea | Tipo | Sugerencia |',
          '|------:|------|------------|',
          ...data.reviews.map(
            (r: Review) =>
              `| ${r.linea} | \`${r.tipo}\` | ${r.sugerencia} |`
          ),
        ].join('\n');
        setReviewMarkdown(md);
      } else {
        setReviewMarkdown('> ⚠️ No se recibieron reviews válidos.');
      }
    } catch (err) {
      console.error(err);
      setReviewMarkdown('> ❌ Error conectando con el endpoint de code review.');
    } finally {
      setLoadingReview(false);
    }
  };

  // ── Toggle folder expand/collapse ──
  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  // ── Render code with line numbers ──
  const renderCode = (code: string) =>
    code.split('\n').map((line, idx) => (
      <div key={idx} className="code-line">
        <span className="line-num">{idx + 1}</span>
        <span>{line}</span>
      </div>
    ));

  // ── Render folder tree recursively ──
  const renderTree = (node: FolderNode, basePath: string = '') => {
    const entries = Object.entries(node).sort(([, a], [, b]) => {
      // Folders first, then files
      if (a !== null && b === null) return -1;
      if (a === null && b !== null) return 1;
      return 0;
    });

    return entries.map(([name, children]) => {
      const fullPath = basePath ? `${basePath}/${name}` : name;

      if (children === null) {
        // File
        const file = scannedFiles.find((f) => f.filepath === fullPath);
        const isActive = selectedFile?.filepath === fullPath;

        return (
          <div
            key={fullPath}
            className={`aipoc-tree-file ${isActive ? 'active' : ''}`}
            onClick={() => file && selectAndReview(file)}
            title={fullPath}
          >
            <FileCode size={14} className="tree-icon file" />
            <span className="tree-name">{name}</span>
            {isActive && loadingReview && (
              <Loader2 size={12} className="aipoc-spinner" style={{ marginLeft: 'auto', color: '#a855f7' }} />
            )}
          </div>
        );
      }

      // Folder
      const isExpanded = expandedFolders.has(fullPath);
      return (
        <div key={fullPath} className="aipoc-tree-folder">
          <div
            className="aipoc-tree-folder-header"
            onClick={() => toggleFolder(fullPath)}
          >
            <ChevronRight
              size={14}
              className={`tree-chevron ${isExpanded ? 'expanded' : ''}`}
            />
            {isExpanded ? (
              <FolderOpen size={14} className="tree-icon folder" />
            ) : (
              <Folder size={14} className="tree-icon folder" />
            )}
            <span className="tree-name">{name}</span>
          </div>
          {isExpanded && (
            <div className="aipoc-tree-children">
              {renderTree(children, fullPath)}
            </div>
          )}
        </div>
      );
    });
  };

  const tree = buildTree(scannedFiles);

  return (
    <div className="aipoc-container">
      {/* ── Header ── */}
      <header className="aipoc-header">
        <div className="aipoc-header-left">
          <button className="aipoc-back-btn" onClick={onBack}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1>AI-Powered Code Review & Doc Scanner</h1>
            <p>Day 2 – Escanea el repositorio y analiza archivos con IA</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {totalFiles > 0 && (
            <span className="aipoc-badge">{totalFiles} archivos</span>
          )}
          <button
            className="aipoc-btn aipoc-btn-primary"
            onClick={scanDirectories}
            disabled={loadingScan}
          >
            {loadingScan ? (
              <Loader2 size={16} className="aipoc-spinner" />
            ) : (
              <FolderSearch size={16} />
            )}
            {loadingScan ? 'Escaneando…' : 'Escanear Proyecto'}
          </button>
        </div>
      </header>

      {/* ── Three-panel Layout ── */}
      <div className="aipoc-layout">
        {/* Sidebar – File Tree */}
        <aside className="aipoc-sidebar">
          <div className="aipoc-panel-header">
            <span className="aipoc-panel-title">
              <FolderSearch size={14} className="icon-doc" />
              Explorador
            </span>
          </div>
          <div className="aipoc-sidebar-body">
            {scannedFiles.length > 0 ? (
              <div className="aipoc-tree">{renderTree(tree)}</div>
            ) : (
              <div className="aipoc-empty" style={{ padding: '30px 16px' }}>
                <FolderSearch size={32} className="aipoc-empty-icon" />
                <p>
                  Haz clic en <strong>"Escanear Proyecto"</strong> para cargar los
                  archivos.
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* Center – Code Viewer */}
        <div className="aipoc-panel aipoc-panel-center">
          <div className="aipoc-panel-header">
            <span className="aipoc-panel-title">
              <FileCode size={14} className="icon-doc" />
              Código Fuente
            </span>
            {selectedFile && (
              <span className="aipoc-panel-filename">
                {selectedFile.filepath}
              </span>
            )}
          </div>
          <div className="aipoc-panel-body">
            {selectedFile ? (
              <div className="aipoc-code-block">
                {renderCode(selectedFile.content)}
              </div>
            ) : (
              <div className="aipoc-empty">
                <FileCode size={40} className="aipoc-empty-icon" />
                <p>
                  Selecciona un archivo del explorador para ver su contenido y
                  analizarlo automáticamente.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right – Review Results */}
        <div className="aipoc-panel aipoc-panel-right">
          <div className="aipoc-panel-header">
            <span className="aipoc-panel-title">
              <Wand2 size={14} className="icon-review" />
              AI Review
            </span>
            {reviews.length > 0 && (
              <span className="aipoc-panel-filename">
                {reviews.length} issue{reviews.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="aipoc-panel-body">
            {loadingReview ? (
              <div className="aipoc-empty">
                <Loader2
                  size={36}
                  className="aipoc-spinner"
                  style={{ color: '#a855f7' }}
                />
                <p>La IA está analizando el código…</p>
              </div>
            ) : reviewMarkdown ? (
              <div className="aipoc-review-results">
                <ReactMarkdown>{reviewMarkdown}</ReactMarkdown>

                {reviews.map((review, idx) => (
                  <div key={idx} className="aipoc-issue-card">
                    <div className="aipoc-issue-card-header">
                      <span className={`aipoc-issue-badge ${review.tipo}`}>
                        {review.tipo}
                      </span>
                      <span className="aipoc-issue-line">
                        Línea {review.linea}
                      </span>
                    </div>
                    <p className="aipoc-issue-text">{review.sugerencia}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="aipoc-empty">
                <Sparkles size={40} className="aipoc-empty-icon" />
                <p>
                  Selecciona un archivo para ver las sugerencias de la IA
                  automáticamente.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIPoc;
