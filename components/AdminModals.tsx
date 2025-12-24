import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, Key, Eye, EyeOff, Settings, Image as ImageIcon, Save, ExternalLink } from 'lucide-react';
import { AppSettings } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, pass: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    // Simple validation passed to parent
    onLogin(email, password);
    setError(''); 
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-slate-900 p-4 flex justify-between items-center">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-400" /> Admin Login
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
           {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="admin@example.com"
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Password</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type={showPass ? "text" : "password"} 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="••••••••"
              />
              <button 
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Access Dashboard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onChangePassword: (newPass: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  email, 
  settings, 
  onSaveSettings, 
  onChangePassword 
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'security'>('general');
  
  // Settings State
  const [imgbbKey, setImgbbKey] = useState(settings.imgbbApiKey || '');
  
  // Password State
  const [newPassword, setNewPassword] = useState('');

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
        setImgbbKey(settings.imgbbApiKey || '');
        setNewPassword('');
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
        ...settings,
        imgbbApiKey: imgbbKey
    });
    alert('Settings saved successfully!');
    onClose();
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword) {
      onChangePassword(newPassword);
      setNewPassword('');
      alert('Password updated successfully!');
    }
  };

  return (
     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="bg-slate-900 p-4 flex justify-between items-center shrink-0">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <Settings className="w-4 h-4 text-emerald-400" /> Admin Settings
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex border-b border-slate-200">
            <button 
                onClick={() => setActiveTab('general')}
                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'general' ? 'border-indigo-500 text-indigo-600 bg-indigo-50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                Integrations
            </button>
            <button 
                onClick={() => setActiveTab('security')}
                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'security' ? 'border-indigo-500 text-indigo-600 bg-indigo-50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                Security
            </button>
        </div>

        <div className="p-6 overflow-y-auto">
            {activeTab === 'general' ? (
                <form onSubmit={handleSaveGeneral} className="space-y-6">
                    <div className="space-y-4">
                         <div className="flex items-start gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                            <ImageIcon className="w-5 h-5 text-indigo-600 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-semibold text-indigo-900">Image Hosting (ImgBB)</h4>
                                <p className="text-xs text-indigo-700 mt-1 leading-relaxed">
                                    To ensure images appear in emails, they must be hosted on a public server. 
                                    Provide an ImgBB API Key to enable auto-hosting.
                                </p>
                                <a 
                                    href="https://api.imgbb.com/" 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-indigo-600 font-medium mt-2 hover:underline"
                                >
                                    Get free API Key <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                         </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">ImgBB API Key</label>
                            <input 
                                type="text" 
                                value={imgbbKey}
                                onChange={e => setImgbbKey(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                                placeholder="e.g. 34d9f..."
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                        <Save className="w-4 h-4" /> Save Settings
                    </button>
                </form>
            ) : (
                <form onSubmit={handleSavePassword} className="space-y-6">
                    <div className="p-3 bg-slate-50 text-slate-600 text-sm rounded-lg border border-slate-200">
                        Updating password for <strong>{email}</strong>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">New Password</label>
                        <input 
                            type="password" 
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            placeholder="Enter new password"
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="w-full bg-emerald-600 text-white py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                        <Save className="w-4 h-4" /> Update Password
                    </button>
                </form>
            )}
        </div>
      </div>
    </div>
  );
};