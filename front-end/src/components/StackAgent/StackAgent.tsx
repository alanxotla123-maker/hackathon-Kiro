import React, { useState } from 'react';
import { ArrowLeft, Settings, UserPlus, Columns, Loader2, X, Edit2, Trash2, Sparkles } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import './StackAgent.css';

interface StackAgentProps {
  onBack?: () => void;
}

interface Task {
  id: number;
  name: string;
  difficulty: string; // 'DIFÍCIL' | 'MEDIA' | 'FÁCIL'
  estimatedTime?: string;
  phase?: string;
}

interface Member {
  id: number;
  name: string;
  role: string;
  stack: string;
  level: string;
  tasks: Task[];
}

export default function StackAgent({ onBack }: StackAgentProps) {
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);
  
  // New Member Form State
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Backend');
  const [newLevel, setNewLevel] = useState('Junior');
  const [newStack, setNewStack] = useState('');

  const [members, setMembers] = useState<Member[]>([
    {
      id: 1,
      name: 'Axel',
      role: 'Backend',
      level: 'Senior',
      stack: 'C#, Python, SQL',
      tasks: []
    },
    {
      id: 2,
      name: 'Andres',
      role: 'Frontend',
      level: 'Mid',
      stack: 'React, TypeScript, CSS',
      tasks: []
    }
  ]);

  const handleAddMember = () => {
    if (!newName.trim() || !newStack.trim()) return;
    
    if (editingMemberId !== null) {
      const updatedMembers = members.map(m => 
        m.id === editingMemberId 
          ? { ...m, name: newName, role: newRole, level: newLevel, stack: newStack } 
          : m
      );
      setMembers(updatedMembers);
    } else {
      const newMember: Member = {
        id: Date.now(),
        name: newName,
        role: newRole,
        level: newLevel,
        stack: newStack,
        tasks: []
      };
      setMembers([...members, newMember]);
    }
    
    setShowAddMemberModal(false);
    
    // Reset form
    setNewName('');
    setNewRole('Backend');
    setNewLevel('Junior');
    setNewStack('');
    setEditingMemberId(null);
  };

  const openEditModal = (member: Member) => {
    setEditingMemberId(member.id);
    setNewName(member.name);
    setNewRole(member.role);
    setNewLevel(member.level);
    setNewStack(member.stack);
    setShowAddMemberModal(true);
  };

  const handleDeleteMember = (id: number) => {
    setMembers(members.filter(m => m.id !== id));
  };

  const handleGenerateBoard = async () => {
    if (!description.trim() || members.length === 0) return;
    
    setIsGenerating(true);
    
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        alert("API Key de Gemini no encontrada. Por favor configura VITE_GEMINI_API_KEY.");
        setIsGenerating(false);
        return;
      }
      
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
      
      const prompt = `
Eres un Tech Lead y Project Manager experto. 
Tengo la siguiente descripción de un proyecto de software:
"${description}"

Y este es mi equipo de desarrolladores (en formato JSON):
${JSON.stringify(members.map(m => ({ id: m.id, role: m.role, level: m.level, stack: m.stack })))}

Por favor, desglosa el proyecto en una lista de tareas técnicas y asígnalas a los miembros del equipo basándote en su rol y nivel de experiencia.
Calcula la dificultad de cada tarea como "DIFÍCIL", "MEDIA", o "FÁCIL".
Asigna un tiempo estimado para realizar cada tarea (ej. "4h", "2d", "1w") en la propiedad "estimatedTime".
Asigna una fase lógica para la tarea (ej. "Fase 1: Setup", "Fase 2: Core", "Fase 3: UI") en la propiedad "phase".
Devuelve la respuesta ÚNICAMENTE como un array de objetos JSON con esta estructura exacta, sin texto adicional ni formateo markdown (\`\`\`json):
[
  { "memberId": 1, "name": "Nombre de la tarea", "difficulty": "MEDIA", "estimatedTime": "2d", "phase": "Fase 1: Setup" }
]
`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text().trim();
      
      // Cleanup possible markdown formatting
      if (text.startsWith('```json')) text = text.replace(/^```json/, '');
      if (text.startsWith('```')) text = text.replace(/^```/, '');
      if (text.endsWith('```')) text = text.replace(/```$/, '');
      text = text.trim();
      
      const generatedTasks = JSON.parse(text);
      
      const updatedMembers = members.map(member => {
        const memberTasks = generatedTasks
          .filter((t: any) => t.memberId === member.id)
          .map((t: any, index: number) => ({
            id: Date.now() + index,
            name: t.name,
            difficulty: t.difficulty,
            estimatedTime: t.estimatedTime,
            phase: t.phase
          }));
          
        return { ...member, tasks: memberTasks };
      });
      
      setMembers(updatedMembers);
    } catch (error) {
      console.error("Error generando tablón:", error);
      alert("Hubo un error al generar las tareas con IA. Revisa la consola para más detalles.");
    } finally {
      setIsGenerating(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'DIFÍCIL': return '#ef4444'; // Red
      case 'MEDIA': return '#eab308'; // Yellow
      case 'FÁCIL': return '#10b981'; // Green
      default: return '#64748b';
    }
  };

  return (
    <div className="stackagent-container">
      {/* Header */}
      <header className="stackagent-header">
        <div className="stackagent-title-group">
          <ArrowLeft size={18} className="back-icon" onClick={onBack} />
          <div className="title-text">
            <h1>StackAgent</h1>
            <span className="subtitle">WORK DISTRIBUTOR</span>
          </div>
        </div>
      </header>

      <div className="stackagent-content">
        {/* Left Sidebar */}
        <aside className="stackagent-sidebar">
          {/* System Summary */}
          <div className="section-block">
            <h2 className="section-title">Resumen del sistema</h2>
            <div className="textarea-wrapper">
              <textarea
                placeholder="Escribe aquí la descripción del sistema o proyecto..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div className="edit-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Edit2 size={14} color="#94a3b8" />
              </div>
            </div>
          </div>

          {/* Members + Stack */}
          <div className="section-block members-section">
            <div className="section-title-row">
              <h2 className="section-title">integrantes + stack</h2>
              <Settings size={14} className="settings-icon" />
            </div>

            <button className="add-member-btn" onClick={() => {
              setEditingMemberId(null);
              setNewName('');
              setNewRole('Backend');
              setNewLevel('Junior');
              setNewStack('');
              setShowAddMemberModal(true);
            }}>
              <UserPlus size={14} />
              Agregar int.
            </button>

            <div className="members-list">
              {members.map(member => (
                <div key={member.id} className="member-list-item">
                  <div className="member-actions">
                    <button className="member-action-btn" onClick={() => openEditModal(member)} title="Editar">
                      <Edit2 size={12} />
                    </button>
                    <button className="member-action-btn delete" onClick={() => handleDeleteMember(member.id)} title="Eliminar">
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <div className="member-name-role">
                    <span className="member-name">{member.name}</span>
                    <span className="member-role">[{member.role}]</span>
                  </div>
                  <div className="member-stack">[{member.stack}]</div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <button 
            className="generate-board-btn" 
            onClick={handleGenerateBoard}
            disabled={isGenerating || members.length === 0 || !description.trim()}
          >
            {isGenerating ? (
              <div className="generating-text">
                <Loader2 size={14} className="spinner" />
                GENERANDO CON IA...
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Sparkles size={16} />
                GENERAR / ACTUALIZAR TABLÓN
              </div>
            )}
          </button>
        </aside>

        {/* Right Board Area */}
        <main className="stackagent-board-area">
          <div className="board-header">
            <h2>tablón de distribución</h2>
            <div className="difficulty-legend">
              <span className="legend-title">DIFICULTAD DE TAREA:</span>
              <div className="legend-item"><span className="dot hard"></span> DIFÍCIL</div>
              <div className="legend-item"><span className="dot medium"></span> MEDIA</div>
              <div className="legend-item"><span className="dot easy"></span> FÁCIL</div>
            </div>
          </div>

          <div className="board-columns">
            {/* Backend Column */}
            <div className="board-column">
              <h3 className="column-title backend">Backend</h3>
              <div className="column-content">
                {members.filter(m => m.role === 'Backend').map(member => (
                  <div key={member.id} className={`member-card ${member.tasks.length > 0 ? 'active-card' : 'empty-tasks'}`}>
                    <div className="member-card-header">
                      <span className="card-name">{member.name}</span>
                      <span className="card-stack">{member.stack}</span>
                    </div>
                    {member.tasks.length > 0 ? (
                      <div className="member-tasks">
                        {member.tasks.map(task => (
                          <div key={task.id} className="task-item">
                            <span className="task-dot" style={{ backgroundColor: getDifficultyColor(task.difficulty) }}></span>
                            <div className="task-content">
                              <span className="task-name">{task.name}</span>
                              <div className="task-meta">
                                {task.phase && <span className="task-phase">{task.phase}</span>}
                                {task.estimatedTime && <span className="task-time">{task.estimatedTime}</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                       <div className="member-card-empty-icon">
                        <Columns size={16} />
                      </div>
                    )}
                  </div>
                ))}
                {/* Empty placeholders */}
                <div className="empty-card-placeholder"></div>
              </div>
            </div>

            {/* Frontend Column */}
            <div className="board-column">
              <h3 className="column-title frontend">Frontend</h3>
              <div className="column-content">
                {members.filter(m => m.role === 'Frontend').map(member => (
                   <div key={member.id} className={`member-card ${member.tasks.length > 0 ? 'active-card' : 'empty-tasks'}`}>
                    <div className="member-card-header">
                      <span className="card-name">{member.name}</span>
                      <span className="card-stack">{member.stack}</span>
                    </div>
                    {member.tasks.length > 0 ? (
                      <div className="member-tasks">
                        {member.tasks.map(task => (
                          <div key={task.id} className="task-item">
                            <span className="task-dot" style={{ backgroundColor: getDifficultyColor(task.difficulty) }}></span>
                            <div className="task-content">
                              <span className="task-name">{task.name}</span>
                              <div className="task-meta">
                                {task.phase && <span className="task-phase">{task.phase}</span>}
                                {task.estimatedTime && <span className="task-time">{task.estimatedTime}</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                       <div className="member-card-empty-icon">
                        <Columns size={16} />
                      </div>
                    )}
                  </div>
                ))}
                {/* Empty placeholders */}
                <div className="empty-card-placeholder"></div>
              </div>
            </div>

            {/* Fullstack Column */}
            <div className="board-column">
              <h3 className="column-title fullstack">FULLSTACK</h3>
              <div className="column-content">
                {members.filter(m => m.role === 'Fullstack').map(member => (
                   <div key={member.id} className={`member-card ${member.tasks.length > 0 ? 'active-card' : 'empty-tasks'}`}>
                    <div className="member-card-header">
                      <span className="card-name">{member.name}</span>
                      <span className="card-stack">{member.stack}</span>
                    </div>
                    {member.tasks.length > 0 ? (
                      <div className="member-tasks">
                        {member.tasks.map(task => (
                          <div key={task.id} className="task-item">
                            <span className="task-dot" style={{ backgroundColor: getDifficultyColor(task.difficulty) }}></span>
                            <div className="task-content">
                              <span className="task-name">{task.name}</span>
                              <div className="task-meta">
                                {task.phase && <span className="task-phase">{task.phase}</span>}
                                {task.estimatedTime && <span className="task-time">{task.estimatedTime}</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                       <div className="member-card-empty-icon">
                        <Columns size={16} />
                      </div>
                    )}
                  </div>
                ))}
                <div className="empty-card-placeholder"></div>
                <div className="empty-card-placeholder"></div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingMemberId !== null ? 'Editar Integrante' : 'Agregar Integrante'}</h3>
              <button className="close-modal-btn" onClick={() => setShowAddMemberModal(false)}>
                <X size={16} />
              </button>
            </div>
            
            <div className="form-group">
              <label>Nombre</label>
              <input 
                type="text" 
                placeholder="Ej. Axel" 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)} 
              />
            </div>
            
            <div className="form-group">
              <label>Rol</label>
              <select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                <option value="Backend">Backend</option>
                <option value="Frontend">Frontend</option>
                <option value="Fullstack">Fullstack</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Nivel</label>
              <select value={newLevel} onChange={(e) => setNewLevel(e.target.value)}>
                <option value="Junior">Junior</option>
                <option value="Mid">Mid</option>
                <option value="Senior">Senior</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Tecnologías / Lenguajes</label>
              <input 
                type="text" 
                placeholder="Ej. C#, Python, SQL..." 
                value={newStack} 
                onChange={(e) => setNewStack(e.target.value)} 
              />
            </div>
            
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowAddMemberModal(false)}>
                Cancelar
              </button>
              <button className="btn-submit" onClick={handleAddMember} disabled={!newName.trim() || !newStack.trim()}>
                Guardar Integrante
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
