import React, { useState, useEffect } from 'react';
import { FileText, Loader2, Download, GitBranch, Link2, Activity, Check, Settings, ArrowLeft, Save, FolderOpen, X, Trash2 } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ReactMarkdown from 'react-markdown';
import type { Table } from './types';

interface DocifyViewProps {
  tables: Table[];
  showNotification: (msg: string) => void;
  onBack?: () => void;
}

export const DocifyView: React.FC<DocifyViewProps> = ({ tables, showNotification, onBack }) => {
  const [docifyRepoUrl, setDocifyRepoUrl] = useState<string>('https://github.com/usuario/repo-name');
  const [docifyStatus, setDocifyStatus] = useState<'idle' | 'cloning' | 'filtering' | 'generating' | 'converting' | 'ready'>('idle');
  const [docifyLoadingStep, setDocifyLoadingStep] = useState<number>(0);
  const [, setDocifyProgressText] = useState<string>('');
  const [docifyRealLanguages, setDocifyRealLanguages] = useState<string>('');
  const [docifyRealFiles, setDocifyRealFiles] = useState<Array<{name: string, type: string}>>([]);
  const [docifyLLMResponse, setDocifyLLMResponse] = useState<string>('');

  const [savedDocs, setSavedDocs] = useState<any[]>([]);
  const [showSavedPanel, setShowSavedPanel] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveDialogName, setSaveDialogName] = useState('');

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/doc-generator/docs');
        if (res.ok) {
          const docs = await res.json();
          setSavedDocs(docs);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchDocs();
  }, []);

  const handleConfirmSave = async () => {
    if (!saveDialogName.trim() || !docifyLLMResponse.trim()) {
      showNotification('Necesitas generar un análisis primero y darle un nombre.');
      return;
    }
    try {
      const res = await fetch('http://localhost:3000/api/doc-generator/docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: saveDialogName,
          repoUrl: docifyRepoUrl,
          generatedReadme: docifyLLMResponse
        })
      });
      if (res.ok) {
        const newDoc = await res.json();
        setSavedDocs([newDoc, ...savedDocs]);
        setSaveDialogOpen(false);
        setSaveDialogName('');
        showNotification('Documentación guardada exitosamente.');
      }
    } catch (e) {
      console.error(e);
      showNotification('Error al guardar la documentación.');
    }
  };

  const handleLoadDoc = (doc: any) => {
    setDocifyRepoUrl(doc.repoUrl);
    setDocifyLLMResponse(doc.generatedReadme);
    setDocifyStatus('ready');
    setDocifyLoadingStep(5);
    setShowSavedPanel(false);
    showNotification('Documentación cargada.');
  };

  const handleDeleteDoc = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:3000/api/doc-generator/docs/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSavedDocs(savedDocs.filter(d => d.id !== id));
      }
    } catch(e) {
      console.error(e);
    }
  };

  const startDocifyAnalysis = async () => {
    if (!docifyRepoUrl.trim()) {
      showNotification('Por favor ingresa una URL válida');
      return;
    }
    setDocifyStatus('cloning');
    setDocifyLoadingStep(1);
    setDocifyProgressText('Iniciando descarga del repositorio...');
    setDocifyRealLanguages('');
    setDocifyRealFiles([]);

    try {
      let repoPath = docifyRepoUrl.replace('https://github.com/', '').replace('.git', '');
      repoPath = repoPath.endsWith('/') ? repoPath.slice(0, -1) : repoPath;
      
      let branch = 'main';

      if (repoPath.split('/').length >= 2) {
        const resLang = await fetch(`https://api.github.com/repos/${repoPath}/languages`);
        if (resLang.ok) {
          const dataLang = await resLang.json();
          const langs = Object.keys(dataLang);
          if (langs.length > 0) {
            setDocifyRealLanguages(langs.join(', '));
          }
        } else if (resLang.status === 404 || resLang.status === 403) {
          showNotification('Repositorio privado o no encontrado. Se generará un análisis simulado básico.');
        }

        const repoRes = await fetch(`https://api.github.com/repos/${repoPath}`);
        if (repoRes.ok) {
          const repoData = await repoRes.json();
          branch = repoData.default_branch || 'main';
          
          const treeRes = await fetch(`https://api.github.com/repos/${repoPath}/git/trees/${branch}?recursive=1`);
          if (treeRes.ok) {
            const treeData = await treeRes.json();
            if (treeData.tree && Array.isArray(treeData.tree)) {
              let important = treeData.tree.filter((f: any) => {
                const path = f.path.toLowerCase();
                if (path.includes('node_modules') || path.includes('.git') || path.includes('dist') || path.includes('build') || path.endsWith('.lock') || path.includes('.vscode')) return false;
                const parts = path.split('/');
                return parts.length === 1 || (parts.length === 2 && (parts[0] === 'src' || parts[0] === 'app' || parts[0] === 'lib' || parts[0] === 'components' || parts[0] === 'pages'));
              });

              important.sort((a: any, b: any) => {
                const getScore = (f: any) => {
                  const p = f.path.toLowerCase();
                  if (f.type === 'tree' && (p === 'src' || p === 'app' || p === 'backend' || p === 'frontend' || p === 'api' || p === 'mobile')) return 100;
                  if (p === 'package.json' || p === 'readme.md' || p === 'docker-compose.yml') return 90;
                  if (f.type === 'tree') return 50; 
                  if (p.includes('src/') && (p.endsWith('main.ts') || p.endsWith('app.tsx') || p.endsWith('index.ts') || p.endsWith('index.js'))) return 80;
                  if (p.endsWith('.md') || p.endsWith('.txt')) return 5;
                  return 10;
                };
                return getScore(b) - getScore(a);
              });
              
              important = important.slice(0, 15); 
              
              const mappedFiles = important.map((c: any) => ({ name: c.path, type: c.type === 'blob' ? 'file' : 'dir' }));
              setDocifyRealFiles(mappedFiles);

              setDocifyStatus('filtering');
              setDocifyLoadingStep(2);
              setDocifyProgressText('Conectando con Inteligencia Artificial (Gemini)...');
              
              const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
              if (!apiKey) {
                throw new Error('No se encontró la API Key de Gemini en .env');
              }
              const genAI = new GoogleGenerativeAI(apiKey);
              const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

              setDocifyStatus('generating');
              setDocifyLoadingStep(3);
              setDocifyProgressText('Descargando contenido profundo del repositorio...');

              const fetchRawFile = async (path: string) => {
                try {
                  const res = await fetch(`https://raw.githubusercontent.com/${repoPath}/${branch}/${path}`);
                  if (res.ok) return await res.text();
                } catch(e) {}
                return null;
              };

              const packageJson = await fetchRawFile('package.json');
              const readmeMd = await fetchRawFile('README.md');

              let filesContext = 'Estructura de archivos:\n' + mappedFiles.map((f: any) => f.name).join('\n');
              let contextStr = `Repositorio: ${repoPath}\n\nArchivos detectados:\n${filesContext}\n\n`;
              if (packageJson) contextStr += `Contenido de package.json:\n${packageJson.substring(0, 1500)}\n\n`;
              if (readmeMd) contextStr += `Contenido de README.md:\n${readmeMd.substring(0, 2000)}\n\n`;

              let dbContext = 'No hay tablas personalizadas definidas.';
              if (tables && tables.length > 0 && !(tables.length === 2 && tables[0].name === 'users' && tables[1].name === 'orders')) {
                dbContext = tables.map((t: any) => `Tabla ${t.name}: columnas (${t.columns.map((c: any) => c.name).join(', ')})`).join('\n');
              }
              contextStr += `Estructura de Base de Datos Diseñada:\n${dbContext}\n\n`;

              const prompt = `Eres un arquitecto de software experto. Analiza el siguiente repositorio de código y genera una documentación técnica profesional en formato Markdown.
Incluye las siguientes secciones (usa subtítulos ##):
1. Resumen Ejecutivo y Propósito
2. Stack Tecnológico Principal
3. Arquitectura del Proyecto (explica la estructura de carpetas)
4. Modelado de Base de Datos (explica cómo las tablas dadas se relacionan con el proyecto)
5. Guía de Despliegue (basada en el entorno detectado)

Usa un tono técnico, profesional. Aquí está el contexto:
${contextStr}`;

              setDocifyStatus('converting');
              setDocifyLoadingStep(4);
              setDocifyProgressText('Generando reporte inteligente (IA trabajando)...');

              const result = await model.generateContent(prompt);
              setDocifyLLMResponse(result.response.text());

              setDocifyStatus('ready');
              setDocifyLoadingStep(5);
              setDocifyProgressText('Documento generado exitosamente!');
              showNotification('Análisis profundo generado por IA');
              return; 
            }
          }
        }
      }
      
      showNotification('Usando análisis local básico (sin IA)...');
      setTimeout(() => {
        setDocifyStatus('ready');
        setDocifyLoadingStep(5);
        setDocifyLLMResponse('');
      }, 1000);
      
    } catch (e: any) {
      console.warn('Analysis error', e);
      showNotification('Error en IA: ' + e.message);
      setDocifyStatus('idle');
    }
  };

  const getRepoDocInfo = (url: string, realLangs?: string, realFiles?: Array<{name: string, type: string}>) => {
    let repoName = url.split('/').pop() || 'project';
    repoName = repoName.replace('.git', '');
    
    let techStack = 'JavaScript, HTML/CSS';
    if (realLangs && realLangs.length > 0) {
      techStack = realLangs;
    } else {
      if (url.includes('react') || url.includes('next')) techStack = 'React.js, TypeScript';
      if (url.includes('node') || url.includes('express')) techStack = 'Node.js, Express, MongoDB';
      if (url.includes('vue') || url.includes('nuxt')) techStack = 'Vue.js, JavaScript';
      if (url.includes('nest') || url.includes('backend')) techStack = 'NestJS, TypeScript, PostgreSQL';
    }
    
    const hasFiles = realFiles && realFiles.length > 0;
    
    let sections = [
      {
        title: '¿De qué está hecho el proyecto? (Stack Tecnológico)',
        items: [
          { name: 'Lenguajes', desc: `${techStack} (Detectados automáticamente desde GitHub)` },
          { name: 'Stack Base', desc: 'JavaScript / TypeScript, HTML5, CSS3.' },
          { name: 'Entorno', desc: 'Node.js y gestor de paquetes moderno.' }
        ]
      }
    ];

    if (hasFiles) {
      sections.push({
        title: 'Propósito de archivos del Repositorio',
        items: realFiles.map(f => {
          let desc = 'Archivo de configuración o código base';
          if (f.name.toLowerCase().includes('readme')) desc = 'Archivo de documentación principal e instrucciones';
          if (f.name.toLowerCase().includes('package.json')) desc = 'Declaración de dependencias del proyecto';
          if (f.name.toLowerCase().includes('src') || f.name.toLowerCase().includes('lib') || f.name.toLowerCase().includes('app') || f.name.toLowerCase().includes('public') || f.name.toLowerCase().includes('mobile')) desc = 'Directorio de código fuente o recursos';
          if (f.name.toLowerCase().includes('backend') || f.name.toLowerCase().includes('api') || f.name.toLowerCase().includes('server')) desc = 'Contiene la lógica del servidor, endpoints y base de datos (Backend)';
          if (f.name.toLowerCase().includes('frontend') || f.name.toLowerCase().includes('web') || f.name.toLowerCase().includes('client')) desc = 'Contiene la interfaz de usuario, componentes y vistas (Frontend)';
          if (f.name.toLowerCase().includes('docker')) desc = 'Configuración para el despliegue en contenedores Docker';
          return { name: f.name, desc };
        })
      });
    }

    if (tables.length > 0) {
      sections.push({
        title: 'Estructura de Base de Datos Detectada',
        items: tables.map(t => ({
          name: `Tabla: ${t.name}`,
          desc: `Contiene ${t.columns.length} columns (${t.columns.map(c => c.name).join(', ')})`
        }))
      });
    }
    
    return { repoName, techStack, sections };
  };

  const handleDownloadDocifyDoc = () => {
    let docContent = '';
    const repoNameStr = docifyRepoUrl ? docifyRepoUrl.split('/').pop() || 'repo' : 'repo';

    if (docifyLLMResponse) {
      docContent = `# Documentación Generada por Inteligencia Artificial\nRepositorio: ${docifyRepoUrl}\nFecha: ${new Date().toLocaleDateString()}\n\n---\n\n${docifyLLMResponse}\n\n---\n> [!NOTE]\n> Este documento técnico fue generado mediante IA de Gemini en Docify.`;
    } else {
      const info = getRepoDocInfo(docifyRepoUrl, docifyRealLanguages, docifyRealFiles);
      
      docContent = `# Documentación de Arquitectura y Código: ${info.repoName}
  
Generada automáticamente por: Agente de Documentación de Código (Docify)
Stack principal: ${info.techStack}
Fecha de generación: ${new Date().toLocaleDateString()}

---
`;

      info.sections.forEach(sec => {
        docContent += `\n## ${sec.title}\n`;
        sec.items.forEach(item => {
          docContent += `- **${item.name}**: ${item.desc}\n`;
        });
      });

      docContent += `
---

> [!NOTE]
> Este archivo fue descargado desde la plataforma integrada Docify.
`;
    }

    const blob = new Blob([docContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${repoNameStr}-docs.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification('Documentación descargada correctamente!');
  };

  return (
    <div className="docify-workspace-container" style={{ display: 'flex', flexDirection: 'row', flex: 1, height: '100%', boxSizing: 'border-box' }}>
      
      {/* Left Sidebar */}
      <aside className="stackagent-sidebar">
        <div className="master-sidebar-logo-group" style={{ cursor: 'pointer', borderBottom: '1px solid #131924' }} onClick={onBack}>
          <ArrowLeft size={16} style={{ color: '#94a3b8', marginRight: '8px' }} />
          <div className="master-logo-text-group">
            <span className="master-logo-text" style={{ fontSize: '13px' }}>Docify</span>
            <span className="master-logo-sub">doc-generator</span>
          </div>
        </div>

        <div style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto', flex: 1 }}>
          <div>
            <h3 style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#64748b',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              margin: '0 0 16px 0'
            }}>Agent Status</h3>

            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <div style={{
                position: 'absolute',
                left: '11px',
                top: '16px',
                bottom: '16px',
                width: '2px',
                background: '#1e293b',
                zIndex: 1
              }} />

              <div style={{ display: 'flex', gap: '16px', zIndex: 2 }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: docifyLoadingStep >= 2 ? 'rgba(16, 185, 129, 0.15)' : (docifyLoadingStep === 1 ? 'rgba(59, 130, 246, 0.15)' : '#0f172a'),
                  border: docifyLoadingStep >= 2 ? '2px solid #10b981' : (docifyLoadingStep === 1 ? '2px solid #3b82f6' : '2px solid #1e293b'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {docifyLoadingStep >= 2 ? (
                    <Check size={12} style={{ color: '#10b981' }} />
                  ) : (
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: docifyLoadingStep === 1 ? '#3b82f6' : '#475569'
                    }} />
                  )}
                </div>
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: docifyLoadingStep === 1 ? 600 : 500, color: docifyLoadingStep === 1 ? '#f8fafc' : '#94a3b8', margin: 0 }}>Cloning repository...</h4>
                  <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', display: 'block' }}>
                    {docifyLoadingStep >= 2 ? 'Fetched 1.2GB from origin/main' : (docifyLoadingStep === 1 ? 'Connecting to github.com...' : 'Pending execution')}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', zIndex: 2 }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: docifyLoadingStep >= 3 ? 'rgba(16, 185, 129, 0.15)' : (docifyLoadingStep === 2 ? 'rgba(59, 130, 246, 0.15)' : '#0f172a'),
                  border: docifyLoadingStep >= 3 ? '2px solid #10b981' : (docifyLoadingStep === 2 ? '2px solid #3b82f6' : '2px solid #1e293b'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {docifyLoadingStep >= 3 ? (
                    <Check size={12} style={{ color: '#10b981' }} />
                  ) : (
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: docifyLoadingStep === 2 ? '#3b82f6' : '#475569'
                    }} />
                  )}
                </div>
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: docifyLoadingStep === 2 ? 600 : 500, color: docifyLoadingStep === 2 ? '#f8fafc' : '#94a3b8', margin: 0 }}>Filtering files...</h4>
                  <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', display: 'block' }}>
                    {docifyLoadingStep >= 3 ? '452 files processed, 21 ignored' : (docifyLoadingStep === 2 ? 'Analyzing directory structure...' : 'Pending current process')}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', zIndex: 2 }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: docifyLoadingStep >= 4 ? 'rgba(16, 185, 129, 0.15)' : (docifyLoadingStep === 3 ? 'rgba(59, 130, 246, 0.15)' : '#0f172a'),
                  border: docifyLoadingStep >= 4 ? '2px solid #10b981' : (docifyLoadingStep === 3 ? '2px solid #3b82f6' : '2px solid #1e293b'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {docifyLoadingStep >= 4 ? (
                    <Check size={12} style={{ color: '#10b981' }} />
                  ) : (
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: docifyLoadingStep === 3 ? '#3b82f6' : '#475569'
                    }} />
                  )}
                </div>
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: docifyLoadingStep === 3 ? 600 : 500, color: docifyLoadingStep === 3 ? '#f8fafc' : '#94a3b8', margin: 0 }}>Generating JSON...</h4>
                  <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', display: 'block' }}>
                    {docifyLoadingStep >= 4 ? 'Extracting signatures completed' : (docifyLoadingStep === 3 ? 'Extracting signatures: Step 4/12' : 'Pending current process')}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', zIndex: 2 }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: docifyLoadingStep >= 5 ? 'rgba(16, 185, 129, 0.15)' : (docifyLoadingStep === 4 ? 'rgba(59, 130, 246, 0.15)' : '#0f172a'),
                  border: docifyLoadingStep >= 5 ? '2px solid #10b981' : (docifyLoadingStep === 4 ? '2px solid #3b82f6' : '2px solid #1e293b'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {docifyLoadingStep >= 5 ? (
                    <Check size={12} style={{ color: '#10b981' }} />
                  ) : (
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: docifyLoadingStep === 4 ? '#3b82f6' : '#475569'
                    }} />
                  )}
                </div>
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: docifyLoadingStep === 4 ? 600 : 500, color: docifyLoadingStep === 4 ? '#f8fafc' : '#94a3b8', margin: 0 }}>Converting to Doc...</h4>
                  <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', display: 'block' }}>
                    {docifyLoadingStep >= 5 ? 'Document generated successfully' : (docifyLoadingStep === 4 ? 'Formating layout & syntax...' : 'Pending current process')}
                  </span>
                </div>
              </div>

            </div>
          </div>

          <div style={{
            marginTop: 'auto',
            background: 'rgba(30, 41, 59, 0.25)',
            border: '1px solid #1e293b',
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={14} style={{ color: '#94a3b8' }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#f1f5f9' }}>Agent Config</span>
            </div>
            <p style={{ fontSize: '11px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
              Infrastructure v2.4 running with signature extraction enabled.
            </p>
          </div>
        </div>
      </aside>

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, padding: '24px', gap: '20px', overflow: 'hidden', boxSizing: 'border-box' }}>
        
        {/* Top Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(30, 41, 59, 0.4)',
          border: '1px solid #1e293b',
          borderRadius: '8px',
          padding: '8px 16px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <Link2 size={16} style={{ color: '#64748b' }} />
          <input
            type="text"
            value={docifyRepoUrl}
            onChange={(e) => setDocifyRepoUrl(e.target.value)}
            placeholder="https://github.com/usuario/repo-name"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#f8fafc',
              flex: 1,
              fontSize: '13px',
              outline: 'none'
            }}
          />
          <button
            onClick={startDocifyAnalysis}
            disabled={docifyStatus !== 'idle' && docifyStatus !== 'ready'}
            style={{
              background: (docifyStatus !== 'idle' && docifyStatus !== 'ready') ? '#1e293b' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 24px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: (docifyStatus !== 'idle' && docifyStatus !== 'ready') ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              boxShadow: (docifyStatus !== 'idle' && docifyStatus !== 'ready') ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.25)'
            }}
          >
            {docifyStatus !== 'idle' && docifyStatus !== 'ready' ? (
              <Loader2 size={13} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Activity size={13} />
            )}
            Analyze
          </button>
          
          <div style={{ width: '1px', height: '16px', background: '#334155', margin: '0 8px' }}></div>
          <button 
            onClick={() => setShowSavedPanel(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: '1px solid #334155', color: '#e2e8f0', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
          >
            <FolderOpen size={13} />
            Cargar
          </button>
          <button 
            onClick={() => setSaveDialogOpen(true)}
            disabled={!docifyLLMResponse.trim()}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: docifyLLMResponse.trim() ? '#38bdf8' : '#1e293b', color: docifyLLMResponse.trim() ? '#0f172a' : '#475569', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: docifyLLMResponse.trim() ? 'pointer' : 'not-allowed', fontSize: '12px', fontWeight: 'bold' }}
          >
            <Save size={13} />
            Guardar
          </button>
        </div>

        <div style={{
          flex: 1,
          minHeight: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          border: '1px solid #1e293b',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}>
          
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'rgba(15, 23, 42, 0.2)'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3b82f6'
            }}>
              <FileText size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
                {docifyRepoUrl ? `${docifyRepoUrl.split('/').pop()}-docs.docx` : 'repo-name-docs.docx'}
              </h3>
              <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', display: 'block' }}>Generated Documentation · Draft v1.0</span>
            </div>
          </div>

          <div style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            alignItems: docifyStatus === 'ready' ? 'flex-start' : 'center',
            justifyContent: 'center',
            background: '#0d111c',
            position: 'relative',
            padding: '24px',
            overflowY: 'auto'
          }}>
            
            {docifyStatus === 'idle' && (
              <div style={{ textAlign: 'center', maxWidth: '320px' }}>
                <FileText size={32} style={{ color: '#475569', marginBottom: '12px' }} />
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Awaiting Analysis</h4>
                <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>Ingresa la URL del repositorio de Git y presiona "Analyze" para generar la documentación del código.</p>
              </div>
            )}

            {(docifyStatus !== 'idle' && docifyStatus !== 'ready') && (
              <div style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid #1e293b',
                borderRadius: '8px',
                padding: '16px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                zIndex: 10
              }}>
                <Loader2 size={16} style={{ color: '#3b82f6', animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc', letterSpacing: '0.05em' }}>PREVIEW GENERATING...</span>
              </div>
            )}

             {docifyStatus === 'ready' && (() => {
              const info = getRepoDocInfo(docifyRepoUrl, docifyRealLanguages, docifyRealFiles);
              return (
                <div style={{
                  width: '100%',
                  minHeight: '100%',
                  height: 'max-content',
                  background: '#080c14',
                  borderRadius: '6px',
                  border: '1px solid #1e293b',
                  padding: '24px',
                  fontFamily: '"Inter", sans-serif',
                  color: '#cbd5e1',
                  textAlign: 'left',
                  boxSizing: 'border-box'
                }}>
                  <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#f8fafc', borderBottom: '1px solid #1e293b', paddingBottom: '12px', marginTop: 0 }}>
                    Documentación de Código: {info.repoName} {docifyLLMResponse && <span style={{fontSize: '11px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)', padding: '3px 8px', borderRadius: '12px', verticalAlign: 'middle', marginLeft: '12px'}}>AI GENERATED</span>}
                  </h1>
                  
                  {docifyLLMResponse ? (
                    <div className="docify-markdown" style={{ fontSize: '13px', lineHeight: '1.7', color: '#cbd5e1' }}>
                      <ReactMarkdown>{docifyLLMResponse}</ReactMarkdown>
                    </div>
                  ) : (
                    <>
                      <p style={{ fontSize: '13px', lineHeight: '1.6', color: '#94a3b8', marginBottom: '20px' }}>
                        Stack principal: <strong style={{ color: '#3b82f6' }}>{info.techStack}</strong>. Esta guía detalla la arquitectura técnica por sesiones del proyecto.
                      </p>

                      {info.sections.map((sec, sidx) => (
                        <div key={sidx} style={{ marginBottom: '24px' }}>
                          <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#3b82f6', borderBottom: '1px solid #1e293b', paddingBottom: '6px', margin: '16px 0 10px 0' }}>
                            {sec.title}
                          </h2>
                          <ul style={{ paddingLeft: '20px', fontSize: '12px', lineHeight: '1.8', color: '#cbd5e1', margin: 0 }}>
                            {sec.items.map((item, iidx) => (
                              <li key={iidx} style={{ marginBottom: '6px' }}>
                                <strong style={{ color: '#f8fafc' }}>{item.name}</strong>: {item.desc}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              );
            })()}

          </div>

          <div style={{
            padding: '12px 20px',
            borderTop: '1px solid #1e293b',
            background: 'rgba(15, 23, 42, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'block' }}></span>
              <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Agent Live</span>
              <span style={{ fontSize: '11px', color: '#475569' }}>| Automatic sync enabled</span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleDownloadDocifyDoc}
                disabled={docifyStatus !== 'ready'}
                style={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: docifyStatus === 'ready' ? '#f8fafc' : '#475569',
                  padding: '6px 16px',
                  fontSize: '12px',
                  cursor: docifyStatus === 'ready' ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 500
                }}
              >
                <Download size={13} />
                Download Doc
              </button>

              <button
                onClick={() => {
                  if (docifyStatus !== 'ready') return;
                  showNotification('Confirmando cambios al repositorio de Git...');
                }}
                disabled={docifyStatus !== 'ready'}
                style={{
                  background: docifyStatus === 'ready' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: '6px',
                  color: docifyStatus === 'ready' ? '#3b82f6' : '#475569',
                  padding: '6px 16px',
                  fontSize: '12px',
                  cursor: docifyStatus === 'ready' ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 600
                }}
              >
                <GitBranch size={13} />
                Commit to Git
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Dialog Modal */}
      {saveDialogOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content" style={{ background: '#0f172a', padding: '24px', borderRadius: '12px', border: '1px solid #1e293b', width: '400px', maxWidth: '90%' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '16px' }}>Guardar Documentación</h3>
              <button onClick={() => setSaveDialogOpen(false)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>Nombre del guardado</label>
              <input 
                type="text" 
                placeholder="Ej. Backend Docs v1..." 
                value={saveDialogName} 
                onChange={(e) => setSaveDialogName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleConfirmSave() }}
                autoFocus
                style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: '#f8fafc', padding: '10px 12px', borderRadius: '6px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setSaveDialogOpen(false)} style={{ background: 'transparent', border: '1px solid #334155', color: '#e2e8f0', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Cancelar</button>
              <button onClick={handleConfirmSave} disabled={!saveDialogName.trim()} style={{ background: '#38bdf8', color: '#0f172a', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: saveDialogName.trim() ? 'pointer' : 'not-allowed', fontSize: '13px', fontWeight: 'bold' }}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saved Docs Panel Modal */}
      {showSavedPanel && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content" style={{ background: '#0f172a', padding: '24px', borderRadius: '12px', border: '1px solid #1e293b', width: '500px', maxWidth: '90%', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '16px' }}>Documentos Guardados</h3>
              <button onClick={() => setShowSavedPanel(false)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
              {savedDocs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b', fontSize: '14px' }}>No hay documentos guardados.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {savedDocs.map(doc => (
                    <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#1e293b', borderRadius: '8px', border: '1px solid #334155' }}>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.name}</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.repoUrl}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>{new Date(doc.updatedAt).toLocaleString()}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                        <button onClick={() => handleLoadDoc(doc)} style={{ background: '#38bdf8', color: '#0f172a', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Cargar</button>
                        <button onClick={() => handleDeleteDoc(doc.id)} style={{ background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
