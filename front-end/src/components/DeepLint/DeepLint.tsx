import React, { useState } from 'react';
import { 
  FileCode, 
  Wand2, 
  ChevronDown, 
  Check, 
  TrendingDown, 
  GitBranch,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import './DeepLint.css';

interface DeepLintProps {
  onBack: () => void;
}

interface FileNode {
  name: string;
  path: string;
  url: string;
  hasSuggestion: boolean;
}

const DeepLint: React.FC<DeepLintProps> = ({ onBack }) => {
  const [repoUrl, setRepoUrl] = useState('https://github.com/facebook/react');
  const [files, setFiles] = useState<FileNode[]>([]);
  const [activeFile, setActiveFile] = useState<string>('');
  const [isFetchingRepo, setIsFetchingRepo] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [leftCode, setLeftCode] = useState<string>('// Ingrese un repositorio y seleccione un archivo\n// para comenzar el análisis.');
  const [rightCode, setRightCode] = useState<string>('// La IA generará el código refactorizado aquí.');
  
  const [metrics, setMetrics] = useState({
    complexity: 12,
    aiOptimized: 4,
    securityScore: 88,
    speed: '14ms'
  });

  const analyzeRepo = async () => {
    if (!repoUrl) return;
    setIsFetchingRepo(true);
    setFiles([]);
    setLeftCode('// Ingrese un repositorio y seleccione un archivo\n// para comenzar el análisis.');
    setRightCode('// La IA generará el código refactorizado aquí.');
    
    try {
      let repoPath = repoUrl.replace('https://github.com/', '').replace('.git', '');
      repoPath = repoPath.endsWith('/') ? repoPath.slice(0, -1) : repoPath;
      
      const repoRes = await fetch(`https://api.github.com/repos/${repoPath}`);
      if (!repoRes.ok) throw new Error('Repo not found');
      const repoData = await repoRes.json();
      const branch = repoData.default_branch || 'main';
      
      const treeRes = await fetch(`https://api.github.com/repos/${repoPath}/git/trees/${branch}?recursive=1`);
      const treeData = await treeRes.json();
      
      if (treeData.tree) {
        let codeFiles = treeData.tree.filter((f: any) => 
          f.type === 'blob' && 
          (f.path.endsWith('.ts') || f.path.endsWith('.tsx') || f.path.endsWith('.js') || f.path.endsWith('.jsx')) &&
          !f.path.includes('node_modules') && !f.path.includes('dist')
        ).slice(0, 15);
        
        setFiles(codeFiles.map((f: any) => ({ 
          name: f.path.split('/').pop(), 
          path: f.path, 
          url: `https://raw.githubusercontent.com/${repoPath}/${branch}/${f.path}`,
          hasSuggestion: Math.random() > 0.5
        })));
      }
    } catch (e) {
      console.error(e);
      alert('Error obteniendo el repositorio. Verifica la URL o los límites de API de GitHub.');
    } finally {
      setIsFetchingRepo(false);
    }
  };

  const handleFileClick = async (file: FileNode) => {
    setActiveFile(file.path);
    setLeftCode('Cargando código fuente...');
    setRightCode('DeepLint AI está analizando el código...');
    setIsAnalyzing(true);
    
    try {
      const rawRes = await fetch(file.url);
      const rawText = await rawRes.text();
      setLeftCode(rawText);

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        setRightCode('Error: Falta VITE_GEMINI_API_KEY en el entorno.');
        return;
      }
      
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
      
      const prompt = `Actúa como DeepLint, un refactorizador avanzado de código.
Refactoriza el siguiente código para mejorar su rendimiento, legibilidad y seguridad. 
Aplica buenas prácticas y reduce la complejidad.
Devuelve estrictamente un JSON con esta estructura exacta (sin markdown tags como \`\`\`json ni nada extra):
{
  "refactoredCode": "el código completo refactorizado aquí",
  "complexity": <número entero estimado de complejidad ciclomática original, ej. 15>,
  "aiOptimized": <número entero de puntos de reducción de complejidad, ej. 5>,
  "securityScore": <número de 1 a 100 evaluando la seguridad del nuevo código>,
  "executionSpeed": "texto estimando velocidad de ejecución, ej. 12ms"
}

Código:
${rawText.slice(0, 5000)}`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        setRightCode(data.refactoredCode || '// Sin respuesta');
        setMetrics({
          complexity: data.complexity || 12,
          aiOptimized: data.aiOptimized || 4,
          securityScore: data.securityScore || 95,
          speed: data.executionSpeed || '10ms'
        });
      } else {
        setRightCode('// Error en el formato devuelto por la IA.\n\n' + responseText);
      }
      
    } catch (e) {
      console.error(e);
      setRightCode('Error analizando archivo con Gemini.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderCode = (code: string) => {
    return code.split('\n').map((line, idx) => (
      <div key={idx} className="code-line">
        <span className="line-num">{idx + 1}</span>
        <span>{line}</span>
      </div>
    ));
  };

  return (
    <div className="deeplint-container">
      {/* Sidebar */}
      <aside className="deeplint-sidebar">
        <div className="sidebar-header">
          <span className="sidebar-title">FILE EXPLORER</span>
          <ChevronDown size={14} className="text-secondary" />
        </div>
        <div className="file-list">
          {isFetchingRepo && <div style={{ padding: '16px', color: '#8b949e', fontSize: '13px', display: 'flex', gap: '8px' }}><Loader2 size={16} className="animate-spin" /> Cargando...</div>}
          {!isFetchingRepo && files.length === 0 && (
            <div style={{ padding: '16px', color: '#8b949e', fontSize: '13px' }}>Sin archivos. Analiza un repositorio.</div>
          )}
          {files.map((file) => (
            <div 
              key={file.path} 
              className={`file-item ${activeFile === file.path ? 'active' : ''}`}
              onClick={() => handleFileClick(file)}
            >
              <FileCode size={16} className="file-icon" />
              <div className="file-info">
                <span className="file-name">{file.name}</span>
                {file.hasSuggestion && <span className="file-badge">AI Suggestion</span>}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="deeplint-main">
        <header className="main-header">
          <div className="header-title-group">
            <button className="deeplint-back-btn" onClick={onBack}>
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="header-title">DeepLint - Code Optimization</h1>
              <p className="header-subtitle">Real-time AI-powered structural analysis and performance refactoring.</p>
            </div>
          </div>
          <div className="header-actions">
            <span className="dropdown-label">ELEGIR REPOSITORIO A EVALUAR</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="repo-input"
                placeholder="https://github.com/usuario/repo"
              />
              <button className="btn-accept" onClick={analyzeRepo} disabled={isFetchingRepo}>
                {isFetchingRepo ? <Loader2 size={16} className="animate-spin" /> : 'Analizar'}
              </button>
            </div>
          </div>
        </header>

        <div className="split-view">
          {/* Left Pane - Original */}
          <div className="code-pane">
            <div className="pane-header">
              <div className="pane-title">
                <GitBranch size={16} />
                <span>GitHub Source</span>
              </div>
              <span className="pane-branch">{activeFile || 'Selecciona un archivo'}</span>
            </div>
            <div className="code-content original-code">
              {renderCode(leftCode)}
            </div>
          </div>

          {/* Right Pane - Optimized */}
          <div className="code-pane ai-pane">
            <div className="pane-header ai-header">
              <div className="pane-title ai-title">
                <Wand2 size={16} className="ai-icon" />
                <span>DeepLint AI</span>
              </div>
              <div className="ai-status">
                {isAnalyzing ? (
                  <span className="status-text" style={{ color: '#3fb950', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Loader2 size={12} className="animate-spin" /> Analizando
                  </span>
                ) : (
                  <>
                    <span className="status-badge">OPTIMIZED</span>
                    <span className="status-text">Refactored Output</span>
                  </>
                )}
              </div>
            </div>
            <div className="code-content optimized-code" style={{ opacity: isAnalyzing ? 0.5 : 1, transition: 'opacity 0.2s' }}>
              {renderCode(rightCode)}
            </div>

            {/* Floating Action Box */}
            {!isAnalyzing && activeFile && rightCode && !rightCode.startsWith('//') && (
              <div className="action-popover">
                <div className="action-content">
                  <div className="action-icon">
                    <Wand2 size={20} />
                  </div>
                  <div className="action-text">
                    <h4>Allow changes?</h4>
                    <p>Refactoring reduces cyclomatic complexity by {Math.round((metrics.aiOptimized / metrics.complexity) * 100) || 24}%</p>
                  </div>
                </div>
                <div className="action-buttons">
                  <button className="btn-decline">Decline</button>
                  <button className="btn-accept">
                    <Check size={16} /> Accept
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Metrics */}
        <div className="metrics-footer">
          <div className="metric-card">
            <span className="metric-label">COMPLEXITY</span>
            <div className="metric-value red">
              {metrics.complexity} <TrendingDown size={18} className="metric-icon" />
            </div>
          </div>
          <div className="metric-card">
            <span className="metric-label">AI OPTIMIZED</span>
            <div className="metric-value green">
              {metrics.aiOptimized} <TrendingDown size={18} className="metric-icon" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DeepLint;
