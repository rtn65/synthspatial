
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import {useAtom} from 'jotai';
import React, {useEffect, useRef, useState} from 'react';
import {ActiveProjectIdAtom, ProjectsAtom, HistoryAtom, GalleryImagesAtom} from './atoms';
import {clearGalleryForProject, clearGalleryMetadataForProject} from './db';

export function ProjectSelector() {
  const [projects, setProjects] = useAtom(ProjectsAtom);
  const [activeProjectId, setActiveProjectId] = useAtom(ActiveProjectIdAtom);
  const [, setHistory] = useAtom(HistoryAtom);
  const [, setGalleryKeys] = useAtom(GalleryImagesAtom);
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setEditingId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      const newProject = {id: Date.now(), name: newProjectName.trim()};
      setProjects([...projects, newProject]);
      setActiveProjectId(newProject.id);
      setNewProjectName('');
      setIsDropdownOpen(false);
    }
  };

  const handleRenameProject = (id: number) => {
    if (editingName.trim()) {
      setProjects(projects.map(p => p.id === id ? { ...p, name: editingName.trim() } : p));
      setEditingId(null);
    }
  };

  const handleDeleteProject = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (projects.length <= 1) {
      alert("En az bir projeniz olmalıdır.");
      return;
    }
    if (confirm("Bu projeyi ve projeye ait TÜM görselleri silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) {
      // 1. Clean up IndexedDB
      await clearGalleryForProject(id);
      await clearGalleryMetadataForProject(id);
      
      // 2. Clean up LocalStorage
      localStorage.removeItem(`history-${id}`);
      localStorage.removeItem(`synthModel-${id}`);
      localStorage.removeItem(`imageSize-${id}`);
      localStorage.removeItem(`editPrompt-${id}`);
      localStorage.removeItem(`batchCount-${id}`);
      
      // 3. Update State
      const updatedProjects = projects.filter(p => p.id !== id);
      setProjects(updatedProjects);
      
      if (activeProjectId === id) {
        const nextProject = updatedProjects[0];
        setActiveProjectId(nextProject.id);
      }
    }
  };

  const handleSwitchProject = (id: number) => {
    if (editingId) return;
    setActiveProjectId(id);
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-color-secondary)] hover:bg-[var(--bg-color)] transition-all shadow-sm"
      >
        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
        <span className="font-black text-xs truncate max-w-[150px] uppercase tracking-tight">
          {activeProject?.name || 'Proje Seçin'}
        </span>
        <span className="text-[10px] opacity-40">▼</span>
      </button>

      {isDropdownOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-2xl shadow-2xl z-[200] overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="p-3 border-b border-[var(--border-color)] bg-[var(--bg-color-secondary)] flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-color-secondary)]">Proje Yönetimi</span>
            <span className="text-[9px] font-mono opacity-50">{projects.length} Proje</span>
          </div>
          
          <ul className="py-2 max-h-64 overflow-y-auto">
            {projects.map((project) => (
              <li key={project.id} className="group px-2">
                <div 
                  onClick={() => handleSwitchProject(project.id)}
                  className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
                    project.id === activeProjectId ? 'bg-[var(--accent-color)] text-white' : 'hover:bg-[var(--bg-color-secondary)]'
                  }`}
                >
                  {editingId === project.id ? (
                    <input 
                      autoFocus
                      className="bg-white text-black px-2 py-1 rounded text-xs w-full mr-2 font-bold outline-none"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRenameProject(project.id)}
                      onBlur={() => handleRenameProject(project.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="text-xs font-bold truncate grow">{project.name}</span>
                  )}
                  
                  <div className={`flex gap-1 transition-opacity ${project.id === activeProjectId ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(project.id);
                        setEditingName(project.name);
                      }}
                      className={`p-1.5 rounded-lg hover:bg-black/10 transition-colors ${project.id === activeProjectId ? 'text-white' : 'text-gray-400'}`}
                      title="Yeniden Adlandır"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4L18.5 2.5z"></path></svg>
                    </button>
                    <button 
                      onClick={(e) => handleDeleteProject(project.id, e)}
                      className={`p-1.5 rounded-lg hover:bg-red-500 hover:text-white transition-colors ${project.id === activeProjectId ? 'text-white/70' : 'text-gray-400'}`}
                      title="Projeyi Sil"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          
          <div className="p-3 border-t border-[var(--border-color)] bg-[var(--bg-color-secondary)]/50">
            <div className="flex gap-2">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Yeni proje adı..."
                className="grow bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:border-[var(--accent-color)] transition-all"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
              />
              <button
                onClick={handleCreateProject}
                className="bg-[var(--accent-color)] text-white w-9 h-9 rounded-xl font-black text-lg flex items-center justify-center shadow-lg active:scale-90 transition-transform"
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
