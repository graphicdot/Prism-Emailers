import React, { useState, useEffect } from 'react';
import { AiActionType, SelectedElement } from '../types';
import { generateAiSuggestion } from '../services/geminiService';
import { Wand2, Type, Link as LinkIcon, Image as ImageIcon, Check, Loader2, Sparkles, X, MoveHorizontal, MoveVertical, ZoomIn, Scaling, Heading } from 'lucide-react';

interface EditorSidebarProps {
  selectedElement: SelectedElement | null;
  onUpdate: (xpath: string, updates: any) => void;
  onSave: () => void;
  onCancel: () => void;
  imgbbApiKey?: string;
}

const TEXT_TAG_OPTIONS: { value: string; label: string }[] = [
    { value: 'P', label: 'Body Text (P)' },
    { value: 'H1', label: 'Heading 1' },
    { value: 'H2', label: 'Heading 2' },
    { value: 'H3', label: 'Heading 3' },
    { value: 'H4', label: 'Heading 4' },
    { value: 'SPAN', label: 'Span' },
    { value: 'DIV', label: 'Div' },
    { value: 'A', label: 'Link' },
];

export const EditorSidebar: React.FC<EditorSidebarProps> = ({ selectedElement, onUpdate, onSave, onCancel, imgbbApiKey }) => {
  const [aiLoading, setAiLoading] = useState(false);
  const [cropPos, setCropPos] = useState({ x: 50, y: 50 });
  const [zoomLevel, setZoomLevel] = useState(1);

  // Update local state when selectedElement changes
  useEffect(() => {
    // Determine position from objectPosition or transformOrigin
    const posString = selectedElement?.objectPosition || selectedElement?.transformOrigin || '50% 50%';
    const parts = posString.split(' ');
    if (parts.length >= 2) {
        setCropPos({
            x: parseInt(parts[0]) || 50,
            y: parseInt(parts[1]) || 50
        });
    } else {
        setCropPos({ x: 50, y: 50 });
    }

    if (selectedElement?.scale) {
        setZoomLevel(selectedElement.scale);
    } else {
        setZoomLevel(1);
    }
  }, [selectedElement]);
  
  if (!selectedElement) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50 border-l border-slate-200">
        <div className="mb-4 p-4 bg-white rounded-full shadow-sm">
            <Sparkles className="w-8 h-8 text-indigo-400" />
        </div>
        <p className="font-medium">Select an element</p>
        <p className="text-sm mt-2">Click on any text, image, or link in the preview to edit it.</p>
      </div>
    );
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate(selectedElement.xpath, { text: e.target.value });
  };

  const handleTagNameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      onUpdate(selectedElement.xpath, { tagName: e.target.value });
  };

  const handleSrcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(selectedElement.xpath, { src: e.target.value });
  };
  
  const handleHrefChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(selectedElement.xpath, { href: e.target.value });
  };

  const handleAltChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(selectedElement.xpath, { alt: e.target.value });
  };

  const handleSizingMode = (mode: 'fit' | 'fill') => {
    let updates: any = {};
    
    if (mode === 'fit') {
        // Fit: Locks dimensions to original size, use Contain.
        updates.objectFit = 'contain';
        // Lock height and width to prevent box resizing
        if (!selectedElement.styleHeight || selectedElement.styleHeight === 'auto') {
            updates.height = selectedElement.computedHeight;
        }
        if (!selectedElement.styleWidth || selectedElement.styleWidth === 'auto') {
            updates.width = selectedElement.computedWidth;
        }
    } else if (mode === 'fill') {
        // Fill: Adjusts height as per image (Auto), keep width locked (to fit container).
        updates.objectFit = 'cover'; // Use cover as a safe default for fill mode
        updates.height = 'auto'; // Auto height for responsive fill
        // Ensure width is locked to container width usually, or keep existing width
        if (!selectedElement.styleWidth || selectedElement.styleWidth === 'auto') {
             updates.width = selectedElement.computedWidth;
        }
    }
    
    onUpdate(selectedElement.xpath, updates);
  };

  const handlePositionChange = (axis: 'x' | 'y', value: string) => {
    const num = parseInt(value);
    const newPos = { ...cropPos, [axis]: num };
    setCropPos(newPos);
    // Update both objectPosition (for fit/contain placement) and transformOrigin (for zoom focus)
    onUpdate(selectedElement.xpath, { objectPosition: `${newPos.x}% ${newPos.y}%` });
  };

  const handleZoomChange = (value: string) => {
      const num = parseFloat(value);
      setZoomLevel(num);
      onUpdate(selectedElement.xpath, { scale: num });
  };

  const handleAiAction = async (action: AiActionType) => {
    if (!selectedElement.text && !selectedElement.src) return;
    
    setAiLoading(true);
    const contentToProcess = selectedElement.text || selectedElement.src || '';
    
    const result = await generateAiSuggestion(
        contentToProcess, 
        action, 
        selectedElement.tagName === 'IMG' ? 'Image in email template' : undefined
    );
    
    setAiLoading(false);
    
    if (action === AiActionType.GENERATE_ALT) {
         onUpdate(selectedElement.xpath, { alt: result });
    } else {
         onUpdate(selectedElement.xpath, { text: result });
    }
  };

  const isFillMode = selectedElement.styleHeight === 'auto' || (!selectedElement.styleHeight && selectedElement.objectFit === 'cover');
  const isImage = selectedElement.tagName === 'IMG';

  return (
    <div className="h-full bg-slate-50 border-l border-slate-200 flex flex-col w-full max-w-sm overflow-y-auto">
      <div className="p-4 border-b border-slate-200 bg-slate-100">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
           {isImage ? 'Image Editor' : 'Text Editor'}
        </h3>
      </div>

      <div className="p-6 space-y-6 flex-1">
        
        {/* Text Editor */}
        {selectedElement.text !== undefined && !isImage && (
          <div className="space-y-4">
             {/* Tag Type Selector */}
             <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Heading className="w-4 h-4 text-slate-400" />
                    Text Type
                </label>
                <select
                    value={selectedElement.tagName}
                    onChange={handleTagNameChange}
                    className="w-full p-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                    {TEXT_TAG_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                    {!TEXT_TAG_OPTIONS.find(o => o.value === selectedElement.tagName) && (
                        <option value={selectedElement.tagName}>{selectedElement.tagName}</option>
                    )}
                </select>
            </div>

            <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Type className="w-4 h-4 text-slate-400" />
                    Content
                </label>
                <textarea
                value={selectedElement.text}
                onChange={handleTextChange}
                rows={6}
                className="w-full p-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none bg-white"
                placeholder="Enter text..."
                />
            </div>

            <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <LinkIcon className="w-4 h-4 text-slate-400" />
                    Link URL
                </label>
                <input
                type="text"
                value={selectedElement.href || ''}
                onChange={handleHrefChange}
                className="w-full p-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                placeholder="https://..."
                />
            </div>
            
            {/* AI Tools for Text */}
            <div className="pt-2">
                <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide flex items-center gap-1">
                    <Wand2 className="w-3 h-3" /> AI Assistant
                </p>
                <div className="grid grid-cols-2 gap-2">
                    <button 
                        onClick={() => handleAiAction(AiActionType.REWRITE_FRIENDLY)}
                        disabled={aiLoading}
                        className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-indigo-600 bg-white border border-indigo-100 rounded hover:bg-indigo-50 transition-colors shadow-sm"
                    >
                       {aiLoading ? <Loader2 className="w-3 h-3 animate-spin"/> : "Friendly"}
                    </button>
                    <button 
                        onClick={() => handleAiAction(AiActionType.REWRITE_PROFESSIONAL)}
                        disabled={aiLoading}
                        className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors shadow-sm"
                    >
                       {aiLoading ? <Loader2 className="w-3 h-3 animate-spin"/> : "Professional"}
                    </button>
                     <button 
                        onClick={() => handleAiAction(AiActionType.SHORTEN)}
                        disabled={aiLoading}
                        className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors shadow-sm"
                    >
                       {aiLoading ? <Loader2 className="w-3 h-3 animate-spin"/> : "Shorten"}
                    </button>
                    <button 
                        onClick={() => handleAiAction(AiActionType.FIX_GRAMMAR)}
                        disabled={aiLoading}
                        className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-emerald-700 bg-white border border-emerald-100 rounded hover:bg-emerald-50 transition-colors shadow-sm"
                    >
                       {aiLoading ? <Loader2 className="w-3 h-3 animate-spin"/> : "Fix Grammar"}
                    </button>
                </div>
            </div>
          </div>
        )}

        {/* Image Editor */}
        {isImage && (
          <div className="space-y-6">
             <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <ImageIcon className="w-4 h-4 text-slate-400" />
                    Image Source
                </label>
                <input
                    type="text"
                    value={selectedElement.src || ''}
                    onChange={handleSrcChange}
                    className="w-full p-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    placeholder="https://..."
                />
                
                <p className="text-[10px] text-amber-600 mt-1">
                    *Add server uploaded image source.
                </p>
            </div>

            <div className="space-y-3 p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <Scaling className="w-4 h-4 text-indigo-500" />
                    Sizing & Zoom
                </label>
                
                {/* Mode Switcher */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                    <button 
                        onClick={() => handleSizingMode('fit')}
                        className={`flex flex-col items-center justify-center py-2 px-1 text-xs font-medium border rounded transition-all ${
                            !isFillMode
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm ring-1 ring-indigo-500' 
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                        title="Fixed dimensions, Fit image"
                    >
                        Fit (Fixed Size)
                    </button>
                    <button 
                         onClick={() => handleSizingMode('fill')}
                         className={`flex flex-col items-center justify-center py-2 px-1 text-xs font-medium border rounded transition-all ${
                            isFillMode
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm ring-1 ring-indigo-500' 
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                         title="Auto height, Fill container"
                    >
                        Fill (Auto Height)
                    </button>
                </div>

                {/* Common Controls for Both Modes */}
                <div className="pt-2 border-t border-slate-100 space-y-4">
                    
                    {/* Zoom Control */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                            <span className="flex items-center gap-1"><ZoomIn className="w-3 h-3" /> Zoom</span>
                            <span className="text-indigo-600">{zoomLevel.toFixed(1)}x</span>
                        </div>
                        <input 
                            type="range" 
                            min="1" 
                            max="3" 
                            step="0.1"
                            value={zoomLevel}
                            onChange={(e) => handleZoomChange(e.target.value)}
                            className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                    </div>

                    {/* Position Controls */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                            <span>Position</span>
                            <span className="text-indigo-600">{cropPos.x}% , {cropPos.y}%</span>
                        </div>
                        
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <MoveHorizontal className="w-3 h-3 text-slate-400" />
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value={cropPos.x}
                                    onChange={(e) => handlePositionChange('x', e.target.value)}
                                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <MoveVertical className="w-3 h-3 text-slate-400" />
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value={cropPos.y}
                                    onChange={(e) => handlePositionChange('y', e.target.value)}
                                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 text-center pt-1">
                            Adjusts placement and zoom focus point
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <LinkIcon className="w-4 h-4 text-slate-400" />
                    Link URL
                </label>
                <input
                    type="text"
                    value={selectedElement.href || ''}
                    onChange={handleHrefChange}
                    className="w-full p-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    placeholder="https://..."
                />
            </div>
            
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Type className="w-4 h-4 text-slate-400" />
                    Alt Text
                </label>
                <div className="flex gap-2">
                    <input
                    type="text"
                    value={selectedElement.alt || ''}
                    onChange={handleAltChange}
                    className="w-full p-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    placeholder="Describe image..."
                    />
                    <button
                        onClick={() => handleAiAction(AiActionType.GENERATE_ALT)}
                        disabled={aiLoading}
                        className="p-2 text-indigo-600 bg-white border border-indigo-100 rounded hover:bg-indigo-50 shadow-sm"
                        title="Generate Alt Text with AI"
                    >
                         <Wand2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Action Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-100 grid grid-cols-2 gap-3">
        <button
            onClick={onCancel}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-red-600 transition-colors shadow-sm"
        >
            <X className="w-4 h-4" />
            Cancel
        </button>
        <button
            onClick={onSave}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
        >
            <Check className="w-4 h-4" />
            Save Changes
        </button>
      </div>
    </div>
  );
};