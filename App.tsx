import React, { useState, useEffect, useCallback } from 'react';
import { DEFAULT_TEMPLATES } from './constants';
import { Template, SelectedElement, Folder, AppSettings } from './types';
import { Preview } from './components/Preview';
import { EditorSidebar } from './components/EditorSidebar';
import { updateHtmlContent } from './utils/htmlHelpers';
import { LoginModal, SettingsModal } from './components/AdminModals';
import { 
  Download, Upload, Layout, Mail, Trash2, Edit2, Check, X, 
  Shield, LogOut, Settings, Folder as FolderIcon, FolderPlus, 
  ChevronLeft, MessageSquare 
} from 'lucide-react';

const STORAGE_KEY = 'prism_templates';
const FOLDERS_KEY = 'prism_folders';
const SETTINGS_KEY = 'prism_settings';

const App: React.FC = () => {
  // Initialize templates from LocalStorage
  const [templates, setTemplates] = useState<Template[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_TEMPLATES;
    } catch (e) {
      console.error("Failed to load templates", e);
      return DEFAULT_TEMPLATES;
    }
  });

  // Initialize folders from LocalStorage
  const [folders, setFolders] = useState<Folder[]>(() => {
    try {
      const saved = localStorage.getItem(FOLDERS_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Failed to load folders", e);
      return [];
    }
  });

  // Initialize Settings
  const [settings, setSettings] = useState<AppSettings>(() => {
      try {
          const saved = localStorage.getItem(SETTINGS_KEY);
          return saved ? JSON.parse(saved) : {};
      } catch (e) {
          return {};
      }
  });

  const [activeTabId, setActiveTabId] = useState<string>(() => {
     return templates[0]?.id || '';
  });

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  // Folder Creation State
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Drag and Drop State
  const [draggedTemplateId, setDraggedTemplateId] = useState<string | null>(null);

  // Sidebar Resizing State
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [isResizing, setIsResizing] = useState(false);

  // Ensure activeTabId is valid
  useEffect(() => {
    if (!templates.find(t => t.id === activeTabId) && templates.length > 0) {
      setActiveTabId(templates[0].id);
    }
  }, [templates, activeTabId]);

  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [snapshotHtml, setSnapshotHtml] = useState<string>('');

  // Admin State
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [adminCreds, setAdminCreds] = useState({ 
    email: 'amit.gawande@oyorooms.com', 
    password: 'password' 
  });
  
  // Renaming State
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const activeTemplate = templates.find(t => t.id === activeTabId) || templates[0];
  const currentFolder = folders.find(f => f.id === currentFolderId);

  // --- Persistence Helpers ---
  const saveTemplatesToStorage = (currentTemplates: Template[]) => {
    if (isAdmin) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentTemplates));
    }
  };

  const saveFoldersToStorage = (currentFolders: Folder[]) => {
    if (isAdmin) {
      localStorage.setItem(FOLDERS_KEY, JSON.stringify(currentFolders));
    }
  };

  const saveSettingsToStorage = (newSettings: AppSettings) => {
      setSettings(newSettings);
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
  };

  // --- Sidebar Resizing Logic ---
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = e.clientX;
        if (newWidth >= 200 && newWidth <= 600) {
          setSidebarWidth(newWidth);
        }
      }
    },
    [isResizing]
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
    } else {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, resize, stopResizing]);

  // --- Folder Logic ---
  const handleCreateFolder = () => {
    if (newFolderName && newFolderName.trim()) {
      const newFolder: Folder = { id: Date.now().toString(), name: newFolderName.trim() };
      // Functional update to ensure we have latest state
      setFolders(prev => {
        // Prepend new folder to be "on top"
        const updated = [newFolder, ...prev];
        saveFoldersToStorage(updated);
        return updated;
      });
      setNewFolderName('');
      setIsCreatingFolder(false);
    }
  };

  const handleDeleteFolder = (e: React.MouseEvent, folderId: string) => {
    e.stopPropagation();
    // Check if folder is empty
    const hasTemplates = templates.some(t => t.folderId === folderId);
    if (hasTemplates) {
      alert("Cannot delete folder. Please move or delete templates inside it first.");
      return;
    }
    
    if (confirm("Delete this empty folder?")) {
      setFolders(prev => {
        const updated = prev.filter(f => f.id !== folderId);
        saveFoldersToStorage(updated);
        return updated;
      });
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (!isAdmin) return;
    setDraggedTemplateId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isAdmin) return;
    e.preventDefault(); // Allow drop
    e.dataTransfer.dropEffect = "move";
  };

  const handleDropOnFolder = (targetFolderId: string) => {
    if (!isAdmin || !draggedTemplateId) return;
    
    const updatedTemplates = templates.map(t => 
      t.id === draggedTemplateId ? { ...t, folderId: targetFolderId } : t
    );
    setTemplates(updatedTemplates);
    saveTemplatesToStorage(updatedTemplates);
    setDraggedTemplateId(null);
  };

  const handleDropOnRoot = () => {
    if (!isAdmin || !draggedTemplateId) return;
    
    const updatedTemplates = templates.map(t => {
      if (t.id === draggedTemplateId) {
        // Remove folderId to move to root
        const { folderId, ...rest } = t;
        return rest;
      }
      return t;
    });
    setTemplates(updatedTemplates);
    saveTemplatesToStorage(updatedTemplates);
    setDraggedTemplateId(null);
  };

  // --- HTML Helpers ---

  const handleUpdateHtml = (xpath: string, updates: any) => {
    if (selectedElement && selectedElement.xpath === xpath) {
        setSelectedElement(prev => prev ? { ...prev, ...updates } : null);
    }
    const updatedHtml = updateHtmlContent(activeTemplate.content, xpath, updates);
    
    setTemplates(prev => {
        const newTemplates = prev.map(t => 
            t.id === activeTabId ? { ...t, content: updatedHtml } : t
        );
        return newTemplates;
    });
  };

  const handleElementSelection = (el: SelectedElement) => {
    setSnapshotHtml(activeTemplate.content);
    setSelectedElement(el);
  };

  const handleCancelChanges = () => {
    if (snapshotHtml) {
        setTemplates(prev => prev.map(t => 
            t.id === activeTabId ? { ...t, content: snapshotHtml } : t
        ));
    }
    setSelectedElement(null);
    setSnapshotHtml('');
  };

  const handleSaveChanges = () => {
    if (isAdmin) {
        saveTemplatesToStorage(templates);
    }
    setSelectedElement(null);
    setSnapshotHtml('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const newTemplate: Template = {
        id: Date.now().toString(),
        name: file.name.replace('.html', ''),
        content: content,
        isUserUploaded: true,
        folderId: currentFolderId || undefined // Upload into current folder
      };
      
      setTemplates(prev => {
          const updated = [...prev, newTemplate];
          if (isAdmin) {
              saveTemplatesToStorage(updated);
          }
          return updated;
      });
      setActiveTabId(newTemplate.id);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDownload = () => {
    const blob = new Blob([activeTemplate.content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTemplate.name}_prism_edited.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- Admin Handlers ---

  const handleLogin = (email: string, pass: string) => {
    if (email === adminCreds.email && pass === adminCreds.password) {
      setIsAdmin(true);
      setShowLoginModal(false);
    } else {
      alert("Invalid Credentials");
    }
  };

  const handleChangePassword = (newPass: string) => {
    setAdminCreds(prev => ({ ...prev, password: newPass }));
  };

  const handleDeleteTemplate = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    e.preventDefault();

    if (templates.length <= 1) {
      alert("You cannot delete the last remaining template.");
      return;
    }

    if (confirm(`Are you sure you want to delete "${name}"?\n\nThis action cannot be undone.`)) {
      const newTemplates = templates.filter(t => t.id !== id);
      setTemplates(newTemplates);
      
      if (activeTabId === id && newTemplates.length > 0) {
        setActiveTabId(newTemplates[0].id);
      }
      
      saveTemplatesToStorage(newTemplates);
    }
  };

  const startRename = (e: React.MouseEvent, template: Template) => {
    e.stopPropagation();
    setRenamingId(template.id);
    setRenameValue(template.name);
  };

  const saveRename = () => {
    if (renamingId && renameValue.trim()) {
      const newTemplates = templates.map(t => 
        t.id === renamingId ? { ...t, name: renameValue.trim() } : t
      );
      setTemplates(newTemplates);
      saveTemplatesToStorage(newTemplates);
    }
    setRenamingId(null);
    setRenameValue('');
  };

  // Filter templates based on current navigation
  const visibleTemplates = templates.filter(t => {
    if (currentFolderId) {
      return t.folderId === currentFolderId;
    }
    return !t.folderId; // Show root templates when no folder selected
  });

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
        onLogin={handleLogin} 
      />
      <SettingsModal 
        isOpen={showSettingsModal} 
        onClose={() => setShowSettingsModal(false)}
        email={adminCreds.email}
        settings={settings}
        onSaveSettings={saveSettingsToStorage}
        onChangePassword={handleChangePassword}
      />

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
                <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
                 <h1 className="text-xl font-bold text-slate-800 tracking-tight">Prism AI Emailers</h1>
                 <p className="text-xs text-slate-500 font-medium">
                   Smart HTML Email Editor {isAdmin && <span className="text-indigo-600 bg-indigo-50 px-1 rounded ml-1">Admin</span>}
                 </p>
            </div>
        </div>
        
        <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors shadow-sm animate-in fade-in">
                <Upload className="w-4 h-4" />
                <span>Upload HTML</span>
                <input type="file" accept=".html" onChange={handleFileUpload} className="hidden" />
            </label>
            
            <button 
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
            >
                <Download className="w-4 h-4" />
                <span>Download HTML</span>
            </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Navigation Sidebar (Tabs) */}
        <div 
          className="bg-slate-900 flex shrink-0 relative group/sidebar"
          style={{ width: sidebarWidth }}
        >
          <div className="flex flex-col w-full h-full overflow-y-auto overflow-x-hidden">
            <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {currentFolder ? 'Folder Content' : 'Templates'}
                  </h2>
                  {isAdmin && !currentFolder && (
                    <button 
                      onClick={() => setIsCreatingFolder(true)}
                      className="text-slate-400 hover:text-white transition-colors"
                      title="Create Folder"
                    >
                      <FolderPlus className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Inline Folder Creator */}
                {isCreatingFolder && (
                    <div className="mb-3 px-1 animate-in slide-in-from-left-2 duration-200">
                        <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-lg border border-indigo-500/50">
                            <FolderIcon className="w-4 h-4 text-indigo-400 shrink-0" />
                            <input 
                                autoFocus
                                type="text"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCreateFolder();
                                    if (e.key === 'Escape') {
                                        setIsCreatingFolder(false);
                                        setNewFolderName('');
                                    }
                                }}
                                className="bg-transparent border-none outline-none text-white text-sm w-full placeholder-slate-500 min-w-0"
                                placeholder="Folder Name"
                            />
                            <div className="flex items-center gap-1 shrink-0">
                                <button onClick={handleCreateFolder} className="text-emerald-400 hover:text-emerald-300 p-0.5">
                                    <Check className="w-3 h-3" />
                                </button>
                                <button onClick={() => { setIsCreatingFolder(false); setNewFolderName(''); }} className="text-red-400 hover:text-red-300 p-0.5">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    {/* Navigation: Back to Root */}
                    {currentFolder && (
                      <div 
                        onClick={() => setCurrentFolderId(null)}
                        onDragOver={(e) => isAdmin && handleDragOver(e)}
                        onDrop={(e) => isAdmin && handleDropOnRoot()}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-3 cursor-pointer text-slate-400 hover:text-white hover:bg-slate-800 border-2 border-transparent hover:border-slate-700 border-dashed"
                      >
                         <ChevronLeft className="w-4 h-4" />
                         <span className="truncate">Back to All</span>
                      </div>
                    )}

                    {/* Folders List (Only at Root) */}
                    {currentFolderId === null && folders.map(folder => (
                      <div
                        key={folder.id}
                        onClick={() => setCurrentFolderId(folder.id)}
                        onDragOver={(e) => isAdmin && handleDragOver(e)}
                        onDrop={(e) => isAdmin && handleDropOnFolder(folder.id)}
                        className="group w-full text-left px-3 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-3 cursor-pointer text-amber-500 hover:text-amber-400 hover:bg-slate-800 relative"
                      >
                        <FolderIcon className="w-4 h-4 shrink-0" />
                        <span className="truncate flex-1 text-slate-300 group-hover:text-white">{folder.name}</span>
                        
                         {/* Admin Folder Controls */}
                         {isAdmin && (
                            <div className="hidden group-hover:flex items-center gap-1 absolute right-2 bg-slate-900/80 p-1 rounded backdrop-blur-sm">
                              <button 
                                onClick={(e) => handleDeleteFolder(e, folder.id)}
                                className="p-1 hover:bg-red-900/50 rounded text-slate-400 hover:text-red-400 transition-colors"
                                title="Delete Empty Folder"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                      </div>
                    ))}

                    {/* Template List */}
                    {visibleTemplates.map(template => (
                        <div
                            key={template.id}
                            draggable={isAdmin}
                            onDragStart={(e) => handleDragStart(e, template.id)}
                            className={`group w-full text-left px-3 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-3 cursor-pointer relative ${
                                activeTabId === template.id 
                                ? 'bg-indigo-600 text-white shadow-lg' 
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            } ${isAdmin && draggedTemplateId === template.id ? 'opacity-50' : ''}`}
                            onClick={() => {
                                if (renamingId === template.id) return;
                                setActiveTabId(template.id);
                                setSelectedElement(null); 
                            }}
                        >
                            <Layout className={`w-4 h-4 shrink-0 ${activeTabId === template.id ? 'text-indigo-200' : 'text-slate-500'}`} />
                            
                            {renamingId === template.id ? (
                              <div className="flex items-center flex-1 min-w-0 gap-1">
                                <input 
                                  type="text" 
                                  value={renameValue}
                                  onChange={(e) => setRenameValue(e.target.value)}
                                  className="w-full bg-slate-800 text-white px-1 py-0.5 rounded outline-none border border-indigo-500 text-xs"
                                  autoFocus
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => {
                                    if(e.key === 'Enter') saveRename();
                                    if(e.key === 'Escape') setRenamingId(null);
                                  }}
                                />
                                <button onClick={(e) => { e.stopPropagation(); saveRename(); }} className="text-emerald-400 hover:text-emerald-300">
                                  <Check className="w-3 h-3" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setRenamingId(null); }} className="text-red-400 hover:text-red-300">
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <span className="truncate flex-1">{template.name}</span>
                            )}

                            {/* Admin Controls */}
                            {isAdmin && renamingId !== template.id && (
                              <div className="hidden group-hover:flex items-center gap-1 absolute right-2 bg-slate-900/80 p-1 rounded backdrop-blur-sm border border-slate-700 shadow-sm">
                                <button 
                                  onClick={(e) => startRename(e, template)}
                                  className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                                  title="Rename"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button 
                                  onClick={(e) => handleDeleteTemplate(e, template.id, template.name)}
                                  className="p-1.5 hover:bg-red-900/50 rounded text-slate-400 hover:text-red-400 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                        </div>
                    ))}
                    
                    {visibleTemplates.length === 0 && folders.length === 0 && !currentFolderId && (
                       <div className="text-slate-600 text-xs text-center py-4">
                         No templates found.
                       </div>
                    )}
                    {visibleTemplates.length === 0 && currentFolderId && (
                       <div className="text-slate-600 text-xs text-center py-4">
                         Folder is empty. <br/> Drag templates here from main list (as Admin).
                       </div>
                    )}
                </div>
            </div>
            
            {/* Admin Login / Logout Section */}
            <div className="mt-auto px-6 pt-4 pb-2">
              {!isAdmin ? (
                <button 
                  onClick={() => setShowLoginModal(true)}
                  className="w-full flex items-center gap-2 text-slate-400 hover:text-white text-xs font-medium py-2 px-3 hover:bg-slate-800 rounded-lg transition-colors mb-2"
                >
                  <Shield className="w-3 h-3" />
                  Admin Login
                </button>
              ) : (
                <div className="mb-2">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium px-3 py-1 bg-emerald-950/30 rounded border border-emerald-900/50 mb-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    Admin Active
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                     <button 
                      onClick={() => setShowSettingsModal(true)}
                      className="flex items-center justify-center gap-1 text-slate-400 hover:text-indigo-300 text-xs py-1.5 hover:bg-slate-800 rounded transition-colors"
                      title="Settings"
                    >
                      <Settings className="w-3 h-3" /> Settings
                    </button>
                    <button 
                      onClick={() => setIsAdmin(false)}
                      className="flex items-center justify-center gap-1 text-slate-400 hover:text-red-300 text-xs py-1.5 hover:bg-slate-800 rounded transition-colors"
                      title="Logout"
                    >
                      <LogOut className="w-3 h-3" /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Help Section */}
            <div className="px-6 pb-4">
               <div className="pt-4 border-t border-slate-800">
                  <h3 className="text-slate-500 text-xs font-semibold mb-2 flex items-center gap-2">
                     <MessageSquare className="w-3 h-3" /> Help & Suggestions
                  </h3>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Send your suggestion to <a href="mailto:amit.gawande@oyorooms.com" className="text-indigo-400 hover:text-indigo-300 transition-colors">amit.gawande@oyorooms.com</a>
                  </p>
               </div>
            </div>

            {/* Promo / Info */}
            <div className="p-6 pt-0 bg-slate-900">
                <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
                    <h3 className="text-white text-sm font-semibold mb-1">Prism AI Pro</h3>
                    <p className="text-slate-400 text-xs mb-3">Unlock advanced generative features.</p>
                    <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 w-2/3"></div>
                    </div>
                </div>
            </div>
          </div>
          
          {/* Resizer Handle */}
          <div
              className={`absolute top-0 right-0 w-1 h-full cursor-ew-resize hover:bg-indigo-500 transition-colors z-50 ${isResizing ? 'bg-indigo-500' : 'bg-transparent'}`}
              onMouseDown={startResizing}
          />
        </div>

        {/* Editor Workspace */}
        <div className="flex-1 flex overflow-hidden">
            {/* Preview Area */}
            <div className="flex-1 bg-slate-100 p-8 flex flex-col overflow-hidden relative">
                 <div className="absolute top-4 left-8 right-8 flex justify-between items-center z-10 pointer-events-none">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur text-xs font-semibold text-slate-500 rounded-full shadow-sm border border-slate-200">
                        {activeTemplate ? `${activeTemplate.name} - Preview` : 'Preview'}
                    </span>
                 </div>
                 
                 <div className="flex-1 shadow-2xl rounded-lg overflow-hidden border border-slate-200 bg-white">
                    <Preview 
                        htmlContent={activeTemplate.content} 
                        onSelectElement={handleElementSelection}
                    />
                 </div>
            </div>

            {/* Properties Sidebar */}
            <div className="w-80 shadow-xl z-20">
                <EditorSidebar 
                    selectedElement={selectedElement}
                    onUpdate={handleUpdateHtml}
                    onSave={handleSaveChanges}
                    onCancel={handleCancelChanges}
                    imgbbApiKey={settings.imgbbApiKey}
                />
            </div>
        </div>
      </div>
    </div>
  );
};

export default App;