
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import React, {useState, useRef, useEffect} from 'react';
import {useAtom} from 'jotai';
import {SynthesisModelAtom, SecondarySynthesisModelAtom, IsDualModelModeAtom, ImageSizeAtom, SynthesisModel} from './atoms';
import { Sparkles, Zap, Video, Rocket, Flame, Palette, SplitSquareHorizontal, ChevronDown } from 'lucide-react';

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
  icon: React.ReactNode;
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
      activeBg: 'bg-yellow-50 dark:bg-yellow-900/20',
      accentText: 'text-yellow-700 dark:text-yellow-400',
      icon: <Zap className="w-4 h-4 text-yellow-500" />
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
      activeBg: 'bg-purple-50 dark:bg-purple-900/20',
      accentText: 'text-purple-700 dark:text-purple-400',
      icon: <Sparkles className="w-4 h-4 text-purple-500" />
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
      activeBg: 'bg-blue-50 dark:bg-blue-900/20',
      accentText: 'text-blue-700 dark:text-blue-400',
      icon: <Video className="w-4 h-4 text-blue-500" />
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
      color: 'bg-slate-800',
      borderColor: 'border-slate-800',
      activeBg: 'bg-slate-100 dark:bg-slate-800/50',
      accentText: 'text-slate-900 dark:text-slate-100',
      icon: <Rocket className="w-4 h-4 text-slate-600 dark:text-slate-400" />
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
      activeBg: 'bg-orange-50 dark:bg-orange-900/20',
      accentText: 'text-orange-700 dark:text-orange-400',
      icon: <Flame className="w-4 h-4 text-orange-500" />
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
      activeBg: 'bg-red-50 dark:bg-red-900/20',
      accentText: 'text-red-700 dark:text-red-400',
      icon: <Palette className="w-4 h-4 text-red-500" />
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
      <div className="flex items-center gap-2 bg-[var(--bg-color-secondary)] p-1 rounded-xl border border-[var(--border-color)]">
        <button 
          onClick={() => { setEditingSlot('primary'); setIsOpen(!isOpen); }}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition-all rounded-lg border ${currentModel.borderColor} ${currentModel.activeBg}`}
        >
          {currentModel.icon}
          <span className={`text-[var(--text-color-primary)] ${currentModel.accentText}`}>
            {isDualMode ? `A: ${currentModel.name}` : currentModel.name}
          </span>
          <ChevronDown className="w-3 h-3 opacity-50 ml-1" />
        </button>

        {isDualMode && (
          <button 
            onClick={() => { setEditingSlot('secondary'); setIsOpen(!isOpen); }}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition-all rounded-lg border ${currentSecondary.borderColor} ${currentSecondary.activeBg}`}
          >
            {currentSecondary.icon}
            <span className={`text-[var(--text-color-primary)] ${currentSecondary.accentText}`}>
              B: {currentSecondary.name}
            </span>
            <ChevronDown className="w-3 h-3 opacity-50 ml-1" />
          </button>
        )}

        <div className="w-px h-6 bg-[var(--border-color)] mx-1"></div>

        <button 
          onClick={() => setIsDualMode(!isDualMode)}
          className={`p-1.5 rounded-lg transition-all ${isDualMode ? 'bg-[var(--accent-color)] text-white shadow-sm' : 'text-[var(--text-color-secondary)] hover:bg-[var(--bg-color)] hover:text-[var(--text-color-primary)]'}`}
          title="Toggle Dual Model Comparison"
        >
          <SplitSquareHorizontal className="w-4 h-4" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl shadow-xl z-[100] p-4 animate-in fade-in slide-in-from-top-2 duration-200 max-h-[70vh] overflow-y-auto">
          <div className="micro-label mb-4 border-b border-[var(--border-color)] pb-2">
            Select Model {editingSlot === 'primary' ? 'A' : 'B'}
          </div>
          
          {Object.entries(groupedModels).map(([provider, providerModels]) => (
            <div key={provider} className="mb-6 last:mb-0">
              <div className="micro-label mb-3 px-1">{provider}</div>
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
                      className={`flex flex-col gap-1 p-3 rounded-lg border text-left transition-all ${isActive ? `${model.borderColor} ${model.activeBg}` : 'border-transparent hover:bg-[var(--bg-color-secondary)]'}`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          {model.icon}
                          <span className="font-medium text-sm text-[var(--text-color-primary)]">{model.name}</span>
                        </div>
                        <span className="font-mono text-[10px] text-[var(--text-color-secondary)]">{model.version}</span>
                      </div>
                      <div className="text-xs text-[var(--text-color-secondary)] mt-1">{model.role}</div>
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
