
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import {GoogleGenAI, Type} from '@google/genai';
import {useSetAtom} from 'jotai';
import {useState} from 'react';
import {EditPromptAtom, ErrorAtom} from './atoms';

export function DataDreamerControls() {
  const setPrompt = useSetAtom(EditPromptAtom);
  const setError = useSetAtom(ErrorAtom);
  
  const [objectName, setObjectName] = useState('');
  const [contextName, setContextName] = useState('');
  const [generatedPrompts, setGeneratedPrompts] = useState<string[]>([]);
  const [isDreaming, setIsDreaming] = useState(false);

  const handleRandomize = () => {
    const objects = ['Forklift', 'Drone', 'PCB Board', 'Wheat Stalk', 'Shipping Container', 'Traffic Cone'];
    const contexts = ['Warehouse', 'Rainy Street', 'Mars Surface', 'Clean Room', 'Underwater', 'Night Highway'];
    setObjectName(objects[Math.floor(Math.random() * objects.length)]);
    setContextName(contexts[Math.floor(Math.random() * contexts.length)]);
  };

  const handleDream = async () => {
    if (!objectName.trim() || !contextName.trim()) {
      setError("Lütfen bir nesne ve bağlam girin.");
      return;
    }
    
    setIsDreaming(true);
    setGeneratedPrompts([]);

    try {
      const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are a Synthetic Data Engineer. Generate 5 distinct, highly detailed, photorealistic image generation prompts for a computer vision dataset. 
        
        Subject: "${objectName}"
        Context: "${contextName}"
        
        Requirements:
        1. Each prompt must vary lighting (e.g., harsh noon, soft dawn, studio, neon).
        2. Each prompt must vary camera angle (e.g., top-down, macro, wide).
        3. Each prompt must vary the state of the object (e.g., pristine, damaged, dirty, wet).
        4. Focus on texture details and background realism.
        5. Output strictly a JSON array of strings. Do not include markdown formatting.`,
        config: {
          temperature: 0.8,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });

      if (response.text) {
        const prompts = JSON.parse(response.text);
        setGeneratedPrompts(prompts);
      }
    } catch (e: any) {
      setError("Prompt üretimi başarısız: " + e.message);
    } finally {
      setIsDreaming(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-800">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-400">💭 DataDreamer: Prompt Generator</div>
        <button onClick={handleRandomize} className="text-[9px] text-indigo-500 hover:text-indigo-700 underline cursor-pointer" title="Rastgele Değerler">🎲 Rastgele</button>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500">Hedef Nesne</label>
            <input 
              type="text" 
              value={objectName} 
              onChange={(e) => setObjectName(e.target.value)} 
              placeholder="Örn: Paslı metal boru"
              className="w-full text-xs p-2 rounded-lg border bg-white dark:bg-black/20 focus:border-indigo-500 outline-none transition-colors"
            />
        </div>
        <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500">Bağlam / Ortam</label>
            <input 
              type="text" 
              value={contextName} 
              onChange={(e) => setContextName(e.target.value)} 
              placeholder="Örn: Terk edilmiş fabrika"
              className="w-full text-xs p-2 rounded-lg border bg-white dark:bg-black/20 focus:border-indigo-500 outline-none transition-colors"
            />
        </div>
      </div>

      <button 
        onClick={handleDream} 
        disabled={isDreaming}
        className="w-full py-2.5 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2"
      >
        {isDreaming ? (
          <>
            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Hayal Ediliyor...</span>
          </>
        ) : (
          <><span>✨</span> <span>Varyasyonları Hayal Et</span></>
        )}
      </button>

      {generatedPrompts.length > 0 && (
        <div className="mt-4 space-y-2 animate-in slide-in-from-bottom-2 fade-in duration-300">
          <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Üretilen Senaryolar</div>
          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {generatedPrompts.map((prompt, idx) => (
              <div key={idx} className="group relative bg-white dark:bg-black/40 p-3 rounded-xl border border-indigo-50 dark:border-indigo-900/30 hover:border-indigo-200 transition-all shadow-sm hover:shadow-md">
                <p className="text-[10px] leading-relaxed text-gray-600 dark:text-gray-300 line-clamp-3 group-hover:line-clamp-none transition-all">{prompt}</p>
                <div className="mt-2 pt-2 border-t border-dashed border-gray-100 dark:border-gray-800 flex justify-end">
                  <button 
                    onClick={() => setPrompt(prompt)}
                    className="text-[9px] font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100 transition-colors"
                  >
                    Kullan ➜
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
