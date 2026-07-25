import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  FileCode,
  Wand2,
  ArrowLeft,
  Loader2,
  FileText,
  Sparkles,
} from 'lucide-react';
import './AIPoc.css';

// ─── Config ──────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:3000/api';

interface AIPocProps {
  onBack: () => void;
}

interface Issue {
  linea: number;
  tipo_de_issue: string;
  sugerencia: string;
}

const AIPoc: React.FC<AIPocProps> = ({ onBack }) => {
  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [reviewMarkdown, setReviewMarkdown] = useState<string>('');
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [loadingReview, setLoadingReview] = useState(false);

  // ── Fetch file from Doc Generator ──
  const fetchDocument = async () => {
    setLoadingDoc(true);
    try {
      const res = await fetch(`${API_BASE}/doc-generator/generate`);
      const data = await res.json();
      setFileContent(data.content || '');
      setFileName(data.filename || 'archivo.ts');
      // Reset review when loading new file
      setIssues([]);
      setReviewMarkdown('');
    } catch (err) {
      console.error(err);
      setFileContent('// Error al obtener el archivo del servidor.');
    } finally {
      setLoadingDoc(false);
    }
  };

  // ── Send code to Code Review ──
  const analyzeCode = async () => {
    if (!fileContent) return;
    setLoadingReview(true);
    setReviewMarkdown('');
    setIssues([]);

    try {
      const res = await fetch(`${API_BASE}/code-review/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: fileContent }),
      });
      const data = await res.json();

      if (data.issues && Array.isArray(data.issues)) {
        setIssues(data.issues);

        // Build a Markdown table from the structured issues
        const md = [
          '## 🔍 Resultados del Code Review',
          '',
          `Se encontraron **${data.issues.length}** observaciones en \`${fileName}\`.`,
          '',
          '| Línea | Tipo | Sugerencia |',
          '|------:|------|------------|',
          ...data.issues.map(
            (i: Issue) =>
              `| ${i.linea} | \`${i.tipo_de_issue}\` | ${i.sugerencia} |`
          ),
        ].join('\n');

        setReviewMarkdown(md);
      } else {
        setReviewMarkdown(
          '> ⚠️ La respuesta del servidor no contenía issues válidos.'
        );
      }
    } catch (err) {
      console.error(err);
      setReviewMarkdown('> ❌ Error conectando con el endpoint de code review.');
    } finally {
      setLoadingReview(false);
    }
  };

  // ── Render code with line numbers ──
  const renderCode = (code: string) =>
    code.split('\n').map((line, idx) => (
      <div key={idx} className="code-line">
        <span className="line-num">{idx + 1}</span>
        <span>{line}</span>
      </div>
    ));

  return (
    <div className="aipoc-container">
      {/* ── Header ── */}
      <header className="aipoc-header">
        <div className="aipoc-header-left">
          <button className="aipoc-back-btn" onClick={onBack}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1>AI-Powered Code Review & Doc Generator</h1>
            <p>POC Day 1 – Analiza archivos del backend en tiempo real</p>
          </div>
        </div>
        <span className="aipoc-badge">POC · Día 1</span>
      </header>

      {/* ── Action Buttons ── */}
      <div className="aipoc-actions">
        <button
          className="aipoc-btn aipoc-btn-primary"
          onClick={fetchDocument}
          disabled={loadingDoc}
        >
          {loadingDoc ? (
            <Loader2 size={16} className="aipoc-spinner" />
          ) : (
            <FileText size={16} />
          )}
          {loadingDoc ? 'Obteniendo…' : 'Obtener Archivo'}
        </button>

        <button
          className="aipoc-btn aipoc-btn-secondary"
          onClick={analyzeCode}
          disabled={!fileContent || loadingReview}
        >
          {loadingReview ? (
            <Loader2 size={16} className="aipoc-spinner" />
          ) : (
            <Sparkles size={16} />
          )}
          {loadingReview ? 'Analizando…' : 'Enviar a Code Review'}
        </button>
      </div>

      {/* ── Split Panels ── */}
      <div className="aipoc-panels">
        {/* Left – File Content */}
        <div className="aipoc-panel">
          <div className="aipoc-panel-header">
            <span className="aipoc-panel-title">
              <FileCode size={14} className="icon-doc" />
              Doc Generator
            </span>
            {fileName && (
              <span className="aipoc-panel-filename">{fileName}</span>
            )}
          </div>
          <div className="aipoc-panel-body">
            {fileContent ? (
              <div className="aipoc-code-block">{renderCode(fileContent)}</div>
            ) : (
              <div className="aipoc-empty">
                <FileText size={40} className="aipoc-empty-icon" />
                <p>
                  Haz clic en <strong>"Obtener Archivo"</strong> para leer un
                  archivo .ts del backend.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right – Review Results */}
        <div className="aipoc-panel">
          <div className="aipoc-panel-header">
            <span className="aipoc-panel-title">
              <Wand2 size={14} className="icon-review" />
              AI Code Review
            </span>
            {issues.length > 0 && (
              <span className="aipoc-panel-filename">
                {issues.length} issue{issues.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="aipoc-panel-body">
            {loadingReview ? (
              <div className="aipoc-empty">
                <Loader2 size={36} className="aipoc-spinner" style={{ color: '#a855f7' }} />
                <p>La IA está analizando el código…</p>
              </div>
            ) : reviewMarkdown ? (
              <div className="aipoc-review-results">
                <ReactMarkdown>{reviewMarkdown}</ReactMarkdown>

                {/* Also render issue cards for visual flair */}
                {issues.map((issue, idx) => (
                  <div key={idx} className="aipoc-issue-card">
                    <div className="aipoc-issue-card-header">
                      <span
                        className={`aipoc-issue-badge ${issue.tipo_de_issue}`}
                      >
                        {issue.tipo_de_issue}
                      </span>
                      <span className="aipoc-issue-line">
                        Línea {issue.linea}
                      </span>
                    </div>
                    <p className="aipoc-issue-text">{issue.sugerencia}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="aipoc-empty">
                <Sparkles size={40} className="aipoc-empty-icon" />
                <p>
                  Primero obtén un archivo, luego envíalo a{' '}
                  <strong>"Code Review"</strong> para ver las sugerencias de la
                  IA.
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
