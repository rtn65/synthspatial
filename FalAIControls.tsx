
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import {useAtom} from 'jotai';
import {FalLoRAScaleAtom, FalNumStepsAtom, FalGuidanceScaleAtom, SynthesisModelAtom} from './atoms';

export function FalAIControls() {
  const [model] = useAtom(SynthesisModelAtom);
  const [loraScale, setLoraScale] = useAtom(FalLoRAScaleAtom);
  const [steps, setSteps] = useAtom(FalNumStepsAtom);
  const [guidance, setGuidance] = useAtom(FalGuidanceScaleAtom);

  if (!model.startsWith('fal-')) return null;

  return (
    <div className="flex flex-col gap-4 p-4 bg-orange-50/50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-800 animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-1">
        <div className="text-[10px] font-black uppercase tracking-widest text-orange-700 dark:text-orange-400">🔥 Fal.ai: Flux Parametreleri</div>
        <div className="px-2 py-0.5 bg-orange-500 text-white text-[8px] font-bold rounded">EXTREME PRECISION</div>
      </div>

      {model === 'fal-flux-lora' && (
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-bold">
            <span className="text-gray-500">LoRA Gücü</span>
            <span className="text-orange-600 font-mono">{loraScale}</span>
          </div>
          <input 
            type="range" min="0" max="1" step="0.1" value={loraScale} onChange={(e) => setLoraScale(Number(e.target.value))}
            className="w-full h-1.5 bg-orange-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-bold">
            <span className="text-gray-500">Adım Sayısı</span>
            <span className="text-orange-600 font-mono">{steps}</span>
          </div>
          <input 
            type="range" min="10" max="50" step="1" value={steps} onChange={(e) => setSteps(Number(e.target.value))}
            className="w-full h-1.5 bg-orange-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
          />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-bold">
            <span className="text-gray-500">Rehberlik (CFG)</span>
            <span className="text-orange-600 font-mono">{guidance}</span>
          </div>
          <input 
            type="range" min="1" max="10" step="0.5" value={guidance} onChange={(e) => setGuidance(Number(e.target.value))}
            className="w-full h-1.5 bg-orange-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
          />
        </div>
      </div>
      
      <p className="text-[9px] text-gray-400 italic">
        *Flux.1 modelleri harici API üzerinden çalıştırılır. Prompt sadakati maksimumdur.
      </p>
    </div>
  );
}
