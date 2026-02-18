
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import React, {useState, useRef, useEffect} from 'react';
import {useAtom} from 'jotai';
import {SynthesisModelAtom, SecondarySynthesisModelAtom, IsDualModelModeAtom, ImageSizeAtom, SynthesisModel} from './atoms';

interface ModelDetail {
  id: SynthesisModel;
  provider: 'Google' | 'Runway' | 'Fal.ai';
  name: string;
  version: string;
  role: string;
  capabilities: string[];
  strengths: string[];
  color: string;
  borderColor: string;
  activeBg: string;
  accentText: string;
  icon: string;
}

export function ModelSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeModel, setActiveModel] = useAtom(SynthesisModelAtom);
  const [secondaryModel, setSecondaryModel] = useAtom(SecondarySynthesisModelAtom);
  const [isDualMode, setIsDualMode] = useAtom(IsDualModelModeAtom);
  const [imageSize, setImageSize] = useAtom(ImageSizeAtom);
  
  const [editingSlot, setEditingSlot] = useState<'primary' | 'secondary'>('primary');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const models: ModelDetail[] = [
    // --- GOOGLE MODELS ---
    {
      id: 'gemini-2.5-flash-image',
      provider: 'Google',
      name: 'Nano Banana',
      version: '2.5 Flash',
      role: 'Hızlı Sentez',
      capabilities: ['Düşük gecikme', 'Hızlı varyasyon'],
      strengths: ['Son derece hızlı'],
      color: 'bg-yellow-400',
      borderColor: 'border-yellow-400',
      activeBg: 'bg-yellow-50',
      accentText: 'text-yellow-700',
      icon: '🍌'
    },
    {
      id: 'gemini-3-pro-image-preview',
      provider: 'Google',
      name: 'Nano Banana Pro',
      version: '3 Pro',
      role: 'Yüksek Sadakat',
      capabilities: ['4K Render', 'Fotogerçekçi', 'Search Grounding'],
      strengths: ['Üstün doku detayı', 'Search entegrasyonu'],
      color: 'bg-purple-600',
      borderColor: 'border-purple-600',
      activeBg: 'bg-purple-50',
      accentText: 'text-purple-700',
      icon: '💎'
    },
    {
      id: 'veo-3.1-fast-generate-preview',
      provider: 'Google',
      name: 'Veo 3.1 Fast',
      version: 'Video',
      role: 'Sinematik Video',
      capabilities: ['Hızlı Video'],
      strengths: ['Google ekosistemiyle tam uyum'],
      color: 'bg-blue-500',
      borderColor: 'border-blue-500',
      activeBg: 'bg-blue-50',
      accentText: 'text-blue-700',
      icon: '🎬'
    },
    // --- RUNWAY MODELS ---
    {
      id: 'runway-gen3',
      provider: 'Runway',
      name: 'Runway Gen-3',
      version: 'Alpha',
      role: 'High-End Video',
      capabilities: ['Motion Brush', 'Kamera Kontrolü'],
      strengths: ['Dünya standartlarında video kalitesi'],
      color: 'bg-black',
      borderColor: 'border-gray-800',
      activeBg: 'bg-gray-100',
      accentText: 'text-black',
      icon: '🚀'
    },
    // --- FAL.AI MODELS ---
    {
      id: 'fal-flux-pro',
      provider: 'Fal.ai',
      name: 'Flux.1 Pro',
      version: 'v1.1',
      role: 'SOTA Realism',
      capabilities: ['Ekstrem Prompt Sadakati', 'Tipografi Başarısı'],
      strengths: ['Dünyanın en iyi prompt takipçisi'],
      color: 'bg-orange-500',
      borderColor: 'border-orange-500',
      activeBg: 'bg-orange-50',
      accentText: 'text-orange-700',
      icon: '🔥'
    },
    {
      id: 'fal-flux-lora',
      provider: 'Fal.ai',
      name: 'Flux LoRA',
      version: 'Dev',
      role: 'Custom Styles',
      capabilities: ['LoRA Desteği', 'Hızlı İterasyon'],
      strengths: ['Özelleştirilebilir stiller'],
      color: 'bg-red-600',
      borderColor: 'border-red-600',
      activeBg: 'bg-red-50',
      accentText: 'text-red-700',
      icon: '🎨'
    }
  ];

  const currentModel = models.find(m => m.id === activeModel) || models[0];
  const currentSecondary = models.find(m => m.id === secondaryModel) || models[1];

  const groupedModels = models.reduce((acc, model) => {
    if (!acc[model.provider]) acc[model.provider] = [];
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, ModelDetail[]>);

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center gap-1.5">
        <button 
          onClick={() => { setEditingSlot('primary'); setIsOpen(!isOpen); }}
          className={`secondary !py-1 !px-3 flex items-center gap-2 text-xs font-black transition-all rounded-full border-2 ${currentModel.borderColor} ${currentModel.activeBg}`}
        >
          <span className="text-[14px]">{currentModel.icon}</span>
          <span className="text-[var(--text-color-primary)]">
            {isDualMode ? `A: ${currentModel.name}` : currentModel.name}
          </span>
        </button>

        {isDualMode && (
          <button 
            onClick={() => { setEditingSlot('secondary'); setIsOpen(!isOpen); }}
            className={`secondary !py-1 !px-3 flex items-center gap-2 text-xs font-black transition-all rounded-full border-2 ${currentSecondary.borderColor} ${currentSecondary.activeBg}`}
          >
            <span className="text-[14px]">{currentSecondary.icon}</span>
            <span className="text-[var(--text-color-primary)]">
              B: {currentSecondary.name}
            </span>
          </button>
        )}

        <button 
          onClick={() => setIsDualMode(!isDualMode)}
          className={`p-2 rounded-full transition-all ${isDualMode ? 'bg-[var(--accent-color)] text-white' : 'bg-[var(--bg-color-secondary)] text-[var(--text-color-secondary)] hover:bg-gray-200'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-2xl shadow-2xl z-[100] p-4 animate-in fade-in slide-in-from-top-2 duration-200 max-h-[70vh] overflow-y-auto">
          <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-color-secondary)] mb-4 border-b pb-2">
            {editingSlot === 'primary' ? 'Motor A' : 'Motor B'} Yapay Zeka Motoru Seç
          </div>
          
          {Object.entries(groupedModels).map(([provider, providerModels]) => (
            <div key={provider} className="mb-6">
              <div className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 px-1">{provider}</div>
              <div className="flex flex-col gap-2">
                {providerModels.map((model) => {
                  const isActive = editingSlot === 'primary' ? activeModel === model.id : secondaryModel === model.id;
                  return (
                    <button 
                      key={model.id}
                      onClick={() => {
                        if (editingSlot === 'primary') setActiveModel(model.id);
                        else setSecondaryModel(model.id);
                        setIsOpen(false);
                      }}
                      className={`flex flex-col gap-1 p-3 rounded-xl border-2 text-left transition-all ${isActive ? `${model.borderColor} ${model.activeBg}` : 'border-transparent hover:bg-gray-50 dark:hover:bg-white/5'}`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{model.icon}</span>
                          <span className="font-bold text-sm">{model.name}</span>
                        </div>
                        <span className="text-[9px] font-mono opacity-50">{model.version}</span>
                      </div>
                      <div className="text-[10px] text-gray-500 font-medium">{model.role}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
