import React, { useState, useEffect } from 'react';

const GITHUB_API_URL = 'https://api.github.com';

const RepoTreeViewer = () => {
  // Estados para los inputs del formulario
  const [ownerInput, setOwnerInput] = useState('');
  const [repoInput, setRepoInput] = useState('');

  // Estados para la búsqueda activa
  const [activeOwner, setActiveOwner] = useState('');
  const [activeRepo, setActiveRepo] = useState('');

  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [commits, setCommits] = useState([]);
  
  // Estados de carga
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [isLoadingCommits, setIsLoadingCommits] = useState(false);
  
  // Manejo de errores
  const [error, setError] = useState(null);

  // Manejador del formulario
  const handleSearch = (e) => {
    e.preventDefault();
    if (!ownerInput.trim() || !repoInput.trim()) return;
    setActiveOwner(ownerInput.trim());
    setActiveRepo(repoInput.trim());
  };

  // 1. Obtener ramas cuando cambia el repositorio activo
  useEffect(() => {
    const fetchBranches = async () => {
      if (!activeOwner || !activeRepo) return;

      try {
        setIsLoadingBranches(true);
        setError(null);
        setBranches([]);
        setCommits([]);
        setSelectedBranch('');
        
        const response = await fetch(`${GITHUB_API_URL}/repos/${activeOwner}/${activeRepo}/branches`);
        
        if (!response.ok) {
          if (response.status === 404) throw new Error('Repositorio no encontrado. Verifica el usuario y el nombre del repositorio.');
          if (response.status === 403) throw new Error('Límite de API de GitHub excedido. Intenta más tarde.');
          throw new Error(`Error al cargar las ramas: ${response.status}`);
        }
        
        const data = await response.json();
        setBranches(data);
        
        // Seleccionar la primera rama por defecto si existen
        if (data.length > 0) {
          setSelectedBranch(data[0].name);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoadingBranches(false);
      }
    };

    fetchBranches();
  }, [activeOwner, activeRepo]);

  // 2. Obtener commits cuando cambia la rama seleccionada
  useEffect(() => {
    const fetchCommits = async () => {
      if (!selectedBranch || !activeOwner || !activeRepo) return;
      
      try {
        setIsLoadingCommits(true);
        setError(null);
        
        const response = await fetch(`${GITHUB_API_URL}/repos/${activeOwner}/${activeRepo}/commits?sha=${selectedBranch}`);
        
        if (!response.ok) {
          throw new Error(`Error al cargar los commits de la rama ${selectedBranch}`);
        }
        
        const data = await response.json();
        setCommits(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoadingCommits(false);
      }
    };

    fetchCommits();
  }, [selectedBranch, activeOwner, activeRepo]);

  // Utilidad para formatear la fecha estilo "hace X días/horas"
  const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now - date) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) return `hace ${seconds} segundos`;
    if (minutes < 60) return `hace ${minutes} minutos`;
    if (hours < 24) return `hace ${hours} horas`;
    if (days === 1) return `hace 1 día`;
    return `hace ${days} días`;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-200 font-sans">
      
      {/* Buscador Superior */}
      <div className="bg-gray-900 border-b border-gray-800 p-4 shrink-0 z-20">
        <form onSubmit={handleSearch} className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label htmlFor="owner" className="block text-xs font-medium text-gray-400 mb-1">
              Usuario / Organización
            </label>
            <input
              id="owner"
              type="text"
              value={ownerInput}
              onChange={(e) => setOwnerInput(e.target.value)}
              placeholder="Ej: dferram"
              className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              required
            />
          </div>
          <div className="flex-1 w-full">
            <label htmlFor="repo" className="block text-xs font-medium text-gray-400 mb-1">
              Repositorio
            </label>
            <input
              id="repo"
              type="text"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              placeholder="Ej: React"
              className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 h-[42px]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            Buscar
          </button>
        </form>
      </div>

      {/* Contenido Principal (Solo se muestra si hay una búsqueda activa o un error general de búsqueda) */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        
        {/* Estado inicial / Vacío */}
        {!activeOwner && !activeRepo && !isLoadingBranches && !error && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
            <svg className="w-16 h-16 mb-4 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
            </svg>
            <h2 className="text-xl font-medium text-gray-400 mb-2">Visor de Repositorios</h2>
            <p className="max-w-md">Ingresa un usuario y un repositorio de GitHub en la barra superior para explorar sus ramas y commits.</p>
          </div>
        )}

        {(activeOwner || isLoadingBranches || error) && (
          <>
            {/* Panel Lateral: Selector de Ramas */}
            <div className="w-full md:w-72 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0 h-1/3 md:h-full">
              <div className="p-5 border-b border-gray-800">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10.9,2.1c-4.6,0.5-8.3,4.2-8.8,8.7c-0.6,5.9,4.1,11,10.1,11.1c2.7,0,5.1-1.1,6.8-2.8l-1.4-1.4c-1.4,1.4-3.3,2.2-5.4,2.2 c-4.4,0-8-3.6-8-8c0-4.1,3.1-7.5,7.1-7.9V6l5-4l-5-4V2.1z"/>
                  </svg>
                  Branches
                </h2>
                {activeOwner && activeRepo && (
                  <p className="text-xs text-gray-500 mt-1">{activeOwner} / {activeRepo}</p>
                )}
              </div>
              
              <div className="p-3 flex-1 overflow-y-auto custom-scrollbar">
                {isLoadingBranches ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-10 bg-gray-800 rounded-md animate-pulse"></div>
                    ))}
                  </div>
                ) : error && branches.length === 0 ? (
                  <div className="p-3 bg-red-900/30 text-red-400 border border-red-900/50 rounded-lg text-sm">
                    {error}
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {branches.map((branch) => (
                      <li key={branch.name}>
                        <button
                          onClick={() => setSelectedBranch(branch.name)}
                          className={`w-full text-left px-4 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                            selectedBranch === branch.name
                              ? 'bg-indigo-600/10 text-indigo-400 font-medium border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                              : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200 border border-transparent'
                          }`}
                        >
                          <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                          </svg>
                          <span className="truncate">{branch.name}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Panel Principal: Línea de Tiempo de Commits */}
            <div className="flex-1 bg-gray-950 overflow-y-auto relative h-2/3 md:h-full">
              <div className="max-w-4xl mx-auto p-6 md:p-10">
                
                {selectedBranch && (
                  <header className="mb-10 pb-4 border-b border-gray-800/60 sticky top-0 bg-gray-950/90 backdrop-blur-md z-10 pt-4">
                    <h1 className="text-2xl font-semibold text-white flex items-center gap-3">
                      Commits en
                      <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-md text-xl border border-indigo-500/30 font-mono">
                        {selectedBranch}
                      </span>
                    </h1>
                  </header>
                )}

                {error && commits.length === 0 && !isLoadingCommits && !isLoadingBranches && selectedBranch && (
                  <div className="bg-red-900/20 border border-red-500/50 text-red-300 p-5 rounded-xl mb-8 flex items-start gap-3">
                    <svg className="w-6 h-6 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <div>
                      <h3 className="font-medium text-red-200">Error de carga</h3>
                      <p className="text-sm opacity-80 mt-1">{error}</p>
                    </div>
                  </div>
                )}

                {isLoadingCommits ? (
                  <div className="space-y-8 pl-4 border-l-2 border-gray-800/50 ml-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="relative pl-8">
                        <div className="absolute -left-[25px] top-2 w-3 h-3 bg-gray-800 rounded-full ring-4 ring-gray-950 animate-pulse"></div>
                        <div className="bg-gray-900/50 border border-gray-800 p-5 rounded-xl space-y-3">
                          <div className="h-6 bg-gray-800 rounded animate-pulse w-3/4"></div>
                          <div className="h-4 bg-gray-800 rounded animate-pulse w-1/3"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="relative pl-4 border-l-2 border-indigo-900/30 ml-4 space-y-10">
                    {commits.map((commit) => (
                      <div key={commit.sha} className="relative pl-8 group">
                        
                        <div className="absolute -left-[25px] top-1.5 w-3 h-3 bg-gray-950 border-2 border-indigo-500 rounded-full group-hover:bg-indigo-400 group-hover:border-indigo-400 group-hover:shadow-[0_0_12px_rgba(99,102,241,0.8)] transition-all duration-300 z-10 ring-4 ring-gray-950"></div>
                        
                        <div className="bg-gray-900/40 border border-gray-800 p-5 rounded-xl shadow-lg hover:border-gray-700 hover:bg-gray-900/80 transition-all duration-300">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                            <h3 className="text-lg text-gray-100 font-medium leading-relaxed">
                              {commit.commit.message.split('\n')[0]}
                            </h3>
                            
                            <a 
                              href={commit.html_url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-xs font-mono text-indigo-400 bg-indigo-950/50 px-2.5 py-1.5 rounded-md border border-indigo-900/50 hover:bg-indigo-900 hover:text-white transition-colors shrink-0 flex items-center gap-1"
                              title="Ver en GitHub"
                            >
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"></path></svg>
                              {commit.sha.substring(0, 7)}
                            </a>
                          </div>
                          
                          <div className="flex items-center gap-3 text-sm text-gray-400 bg-gray-950/50 p-2.5 rounded-lg inline-flex">
                            {commit.author?.avatar_url ? (
                              <img 
                                src={commit.author.avatar_url} 
                                alt={commit.commit.author.name} 
                                className="w-6 h-6 rounded-full border border-gray-700"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-xs text-white border border-gray-700 font-medium">
                                {commit.commit.author.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            
                            <div className="flex items-center flex-wrap gap-x-1.5">
                              <span className="font-medium text-gray-200">{commit.commit.author.name}</span>
                              <span className="text-gray-500">•</span>
                              <span className="text-gray-400" title={new Date(commit.commit.author.date).toLocaleString()}>
                                {timeAgo(commit.commit.author.date)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {commits.length === 0 && !isLoadingCommits && !error && selectedBranch && (
                      <div className="pl-8 text-gray-500 italic">No se encontraron commits en esta rama.</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RepoTreeViewer;
