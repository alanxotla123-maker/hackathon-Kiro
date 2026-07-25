import React, { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import Editor from '@monaco-editor/react';
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
  BookOpen,
  X,
  AlertTriangle,
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
  [key: string]: FolderNode | null;
}

function buildTree(files: ScannedFile[]): FolderNode {
  const tree: FolderNode = {};
  for (const f of files) {
    const parts = f.filepath.split('/');
    let current = tree;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        current[part] = null;
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

// ─── Detect Monaco language from filepath ────────────────────────────
function getLanguage(filepath: string): string {
  if (filepath.endsWith('.tsx')) return 'typescript';
  if (filepath.endsWith('.ts')) return 'typescript';
  if (filepath.endsWith('.jsx')) return 'javascript';
  if (filepath.endsWith('.js')) return 'javascript';
  if (filepath.endsWith('.css')) return 'css';
  if (filepath.endsWith('.json')) return 'json';
  return 'plaintext';
}

const AIPoc: React.FC<AIPocProps> = ({ onBack }) => {
  const [scannedFiles, setScannedFiles] = useState<ScannedFile[]>([]);
  const [totalFiles, setTotalFiles] = useState(0);
  const [selectedFile, setSelectedFile] = useState<ScannedFile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Loading & Error States (UX Polish)
  const [loadingScan, setLoadingScan] = useState(false);
  const [errorScan, setErrorScan] = useState<string | null>(null);

  const [loadingReview, setLoadingReview] = useState(false);
  const [errorReview, setErrorReview] = useState<string | null>(null);

  // Documentation modal state
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docMarkdown, setDocMarkdown] = useState('');
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [errorDoc, setErrorDoc] = useState<string | null>(null);

  // ── Scan directories ──
  const scanDirectories = async () => {
    setLoadingScan(true);
    setErrorScan(null);
    setSelectedFile(null);
    setReviews([]);
    setDocMarkdown('');

    try {
      const res = await fetch(`${API_BASE}/doc-generator/scan`);
      if (!res.ok) throw new Error(`Error del servidor (${res.status})`);
      
      const data = await res.json();
      if (!data.files) throw new Error("Respuesta inválida del endpoint de escaneo.");

      setScannedFiles(data.files || []);
      setTotalFiles(data.totalFiles || 0);

      const topFolders = new Set<string>();
      for (const f of data.files || []) {
        const first = f.filepath.split('/')[0];
        topFolders.add(first);
      }
      setExpandedFolders(topFolders);
    } catch (err: any) {
      console.error(err);
      setErrorScan(err.message || 'No se pudo conectar al servidor de escaneo.');
    } finally {
      setLoadingScan(false);
    }
  };

  // ── Select a file and auto-send to code review ──
  const selectAndReview = useCallback(async (file: ScannedFile) => {
    setSelectedFile(file);
    setLoadingReview(true);
    setErrorReview(null);
    setReviews([]);
    setDocMarkdown('');

    try {
      const res = await fetch(`${API_BASE}/code-review/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: file.content }),
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `La API respondió con error ${res.status}`);
      }
      
      const data = await res.json();

      if (data.reviews && Array.isArray(data.reviews)) {
        setReviews(data.reviews);
      } else {
        // Fallback robusto para casos borde de la IA
        throw new Error("El modelo de IA devolvió una respuesta JSON no válida o malformada.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorReview(err.message || 'Error procesando la revisión de código.');
    } finally {
      setLoadingReview(false);
    }
  }, []);

  // ── Generate documentation ──
  const generateDocs = async () => {
    if (!selectedFile) return;
    setLoadingDoc(true);
    setErrorDoc(null);
    setDocMarkdown('');
    setDocModalOpen(true);

    try {
      const fileName = selectedFile.filepath.split('/').pop() || selectedFile.filepath;
      const res = await fetch(`${API_BASE}/doc-generator/generate-markdown`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: fileName,
          code: selectedFile.content,
        }),
      });
      
      if (!res.ok) throw new Error(`Falló la generación (${res.status})`);
      
      const data = await res.json();
      
      if (typeof data.markdown === 'string') {
        setDocMarkdown(data.markdown);
      } else {
        throw new Error("El modelo de IA no devolvió un Markdown válido.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorDoc(err.message || 'Error de conexión al generar la documentación.');
    } finally {
      setLoadingDoc(false);
    }
  };

  // ── Toggle folder ──
  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  // ── Render folder tree ──
  const renderTree = (node: FolderNode, basePath: string = '') => {
    const entries = Object.entries(node).sort(([, a], [, b]) => {
      if (a !== null && b === null) return -1;
      if (a === null && b !== null) return 1;
      return 0;
    });

    return entries.map(([name, children]) => {
      const fullPath = basePath ? `${basePath}/${name}` : name;

      if (children === null) {
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
              <Loader2
                size={12}
                className="aipoc-spinner"
                style={{ marginLeft: 'auto', color: '#a855f7' }}
              />
            )}
            {isActive && errorReview && (
              <AlertTriangle
                size={12}
                style={{ marginLeft: 'auto', color: '#f85149' }}
              />
            )}
          </div>
        );
      }

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

  // ── Badge color helper ──
  const getBadgeClass = (tipo: string) => {
    switch (tipo) {
      case 'seguridad': return 'badge-seguridad';
      case 'performance': return 'badge-performance';
      case 'estilo': return 'badge-estilo';
      default: return 'badge-estilo';
    }
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
            <h1>Code Review Dashboard</h1>
            <p>Día 5: UI Polish, Error Handling & AI Resilience</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
            {loadingScan ? 'Escaneando…' : 'Escanear'}
          </button>
          <button
            className="aipoc-btn aipoc-btn-doc"
            onClick={generateDocs}
            disabled={!selectedFile || loadingDoc}
          >
            {loadingDoc ? (
              <Loader2 size={16} className="aipoc-spinner" />
            ) : (
              <BookOpen size={16} />
            )}
            Generar Documentación
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
            {errorScan ? (
              <div className="aipoc-empty error">
                <AlertTriangle size={32} style={{ color: '#f85149' }} />
                <p style={{ color: '#f85149' }}><strong>Fallo al escanear</strong><br />{errorScan}</p>
                <button className="aipoc-btn aipoc-btn-primary" onClick={scanDirectories}>
                  Reintentar
                </button>
              </div>
            ) : scannedFiles.length > 0 ? (
              <div className="aipoc-tree">{renderTree(tree)}</div>
            ) : (
              <div className="aipoc-empty" style={{ padding: '30px 16px' }}>
                <FolderSearch size={32} className="aipoc-empty-icon" />
                <p>
                  Haz clic en <strong>"Escanear"</strong> para cargar archivos.
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* Center – Monaco Editor */}
        <div className="aipoc-panel aipoc-panel-center">
          <div className="aipoc-panel-header">
            <span className="aipoc-panel-title">
              <FileCode size={14} className="icon-doc" />
              Editor
            </span>
            {selectedFile && (
              <span className="aipoc-panel-filename">
                {selectedFile.filepath}
              </span>
            )}
          </div>
          <div className="aipoc-panel-body" style={{ padding: 0 }}>
            {selectedFile ? (
              <Editor
                height="100%"
                language={getLanguage(selectedFile.filepath)}
                value={selectedFile.content}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  minimap: { enabled: true },
                  fontSize: 13,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  renderLineHighlight: 'all',
                  padding: { top: 12 },
                  smoothScrolling: true,
                  cursorBlinking: 'smooth',
                }}
              />
            ) : (
              <div className="aipoc-empty">
                <FileCode size={40} className="aipoc-empty-icon" />
                <p>
                  Selecciona un archivo del explorador para ver su código en el
                  editor Monaco.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right – Review Cards */}
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
                <div style={{ position: 'relative' }}>
                  <Loader2 size={36} className="aipoc-spinner" style={{ color: '#a855f7' }} />
                  <Sparkles size={16} style={{ position: 'absolute', top: -5, right: -5, color: '#38bdf8' }} />
                </div>
                <p style={{ marginTop: '12px' }}><strong>Analizando código...</strong><br />La IA está revisando tu código en busca de mejoras de performance y seguridad.</p>
              </div>
            ) : errorReview ? (
              <div className="aipoc-empty error">
                <AlertTriangle size={36} style={{ color: '#f85149' }} />
                <p style={{ color: '#ff7b72' }}><strong>Error en la Revisión</strong></p>
                <p style={{ fontSize: '11.5px', color: '#c9d1d9' }}>{errorReview}</p>
                <button className="aipoc-btn aipoc-btn-secondary" style={{ marginTop: '8px' }} onClick={() => selectedFile && selectAndReview(selectedFile)}>
                  Reintentar Análisis
                </button>
              </div>
            ) : reviews.length > 0 ? (
              <div className="aipoc-review-cards">
                {/* Summary bar */}
                <div className="review-summary">
                  <div className="summary-item">
                    <span className="summary-dot dot-seguridad" />
                    <span>
                      {reviews.filter((r) => r.tipo === 'seguridad').length} seguridad
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-dot dot-performance" />
                    <span>
                      {reviews.filter((r) => r.tipo === 'performance').length} perf
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-dot dot-estilo" />
                    <span>
                      {reviews.filter((r) => r.tipo === 'estilo').length} estilo
                    </span>
                  </div>
                </div>

                {/* Issue cards */}
                {reviews.map((review, idx) => (
                  <div
                    key={idx}
                    className={`review-card ${getBadgeClass(review.tipo)}`}
                  >
                    <div className="review-card-top">
                      <span className={`review-badge ${getBadgeClass(review.tipo)}`}>
                        {review.tipo}
                      </span>
                      <span className="review-line">L{review.linea}</span>
                    </div>
                    <p className="review-suggestion">{review.sugerencia}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="aipoc-empty">
                <Sparkles size={40} className="aipoc-empty-icon" />
                <p>
                  Selecciona un archivo para ver las sugerencias automáticas de la IA.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Documentation Modal ── */}
      {docModalOpen && (
        <div className="doc-modal-overlay" onClick={() => !loadingDoc && setDocModalOpen(false)}>
          <div className="doc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="doc-modal-header">
              <div className="doc-modal-title">
                <BookOpen size={18} />
                <span>Documentación Generada</span>
                {selectedFile && (
                  <span className="doc-modal-file">
                    {selectedFile.filepath.split('/').pop()}
                  </span>
                )}
              </div>
              <button
                className="doc-modal-close"
                onClick={() => setDocModalOpen(false)}
                disabled={loadingDoc}
              >
                <X size={18} />
              </button>
            </div>
            <div className="doc-modal-body">
              {loadingDoc ? (
                <div className="aipoc-empty" style={{ padding: '60px 20px' }}>
                  <Loader2
                    size={40}
                    className="aipoc-spinner"
                    style={{ color: '#3fb950' }}
                  />
                  <p style={{ marginTop: '16px' }}><strong>Redactando documentación...</strong><br />La IA está analizando las dependencias y la estructura del código.</p>
                </div>
              ) : errorDoc ? (
                <div className="aipoc-empty error" style={{ padding: '60px 20px' }}>
                  <AlertTriangle size={40} style={{ color: '#f85149' }} />
                  <p style={{ color: '#ff7b72', marginTop: '12px' }}><strong>Fallo al generar documentación</strong></p>
                  <p style={{ color: '#c9d1d9' }}>{errorDoc}</p>
                  <button className="aipoc-btn aipoc-btn-doc" style={{ marginTop: '12px' }} onClick={generateDocs}>
                    Reintentar
                  </button>
                </div>
              ) : (
                <div className="doc-modal-content">
                  {/* Resilient fallback if markdown is not string, though handled by logic */}
                  {typeof docMarkdown === 'string' ? (
                    <ReactMarkdown>{docMarkdown}</ReactMarkdown>
                  ) : (
                    <div style={{ padding: '20px', color: '#ff7b72' }}>
                      <AlertTriangle size={24} style={{ marginBottom: '8px' }} />
                      <p><strong>Error de Formato</strong></p>
                      <p>La IA devolvió un documento ilegible o malformado. Por favor, vuelve a intentarlo.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIPoc;
