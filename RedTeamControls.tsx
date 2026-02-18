
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import {useSetAtom} from 'jotai';
import {useState, useEffect} from 'react';
import {EditPromptAtom} from './atoms';

const ATTACK_VECTORS = [
  'Optik Kamuflaj (Camouflage)', 
  'Adversarial Patch (Yama)', 
  'Yoğun Oklüzyon (Occlusion)', 
  'Sensör Gürültüsü (Noise)'
];

const SEVERITY = ['Düşük', 'Orta', 'Yüksek', 'Kritik (Model Kırıcı)'];
const PATTERNS = ['Dijital Parazit', 'Dama Tahtası', 'Rastgele Geometrik', 'Doğal Doku Taklidi'];

export function RedTeamControls() {
  const setPrompt = useSetAtom(EditPromptAtom);
  
  const [vector, setVector] = useState(ATTACK_VECTORS[0]);
  const [severity, setSeverity] = useState(SEVERITY[1]);
  const [pattern, setPattern] = useState(PATTERNS[3]);
  const [confuseFactor, setConfuseFactor] = useState(75);

  useEffect(() => {
    let instruction = "";
    
    if (vector.includes('Kamuflaj')) {
      instruction = `Generate an ADVERSARIAL EXAMPLE. The object must match the background texture/color perfectly (Camouflage). Hard to detect.`;
    } else if (vector.includes('Patch')) {
      instruction = `Add a confusing ADVERSARIAL PATCH with ${pattern} on the object. This patch should look unnatural and designed to confuse AI vision systems.`;
    } else if (vector.includes('Oklüzyon')) {
      instruction = `Heavily OCCLUDE the object. Only ${100 - confuseFactor}% of the object should be visible. Block the view with random obstacles.`;
    } else {
      instruction = `Simulate severe SENSOR NOISE and digital artifacts. Degrade image quality to test robustness.`;
    }

    const prompt = `[RED TEAM TEST] Vector: ${vector}. 
    Severity: ${severity}. 
    Confusion Pattern: ${pattern}. 
    Stress Level: ${confuseFactor}%. 
    ${instruction} 
    Make detection extremely difficult.`;
    
    setPrompt(prompt);
  }, [vector, severity, pattern, confuseFactor, setPrompt]);

  return (
    <div className="flex flex-col gap-4 p-4 bg-red-50/50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-800 border-l-4 border-l-red-500">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-black uppercase tracking-widest text-red-700 dark:text-red-400">🚨 Adversarial Saldırı Testi</div>
        <div className="px-2 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded animate-pulse">CANLI</div>
      </div>
      
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-500">Saldırı Vektörü</label>
        <select value={vector} onChange={(e) => setVector(e.target.value)} className="w-full text-xs p-2 rounded-lg border bg-white dark:bg-black/20 border-red-200 text-red-900 dark:text-red-100 font-bold">
          {ATTACK_VECTORS.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-500">Şiddet Düzeyi</label>
          <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="w-full text-xs p-2 rounded-lg border bg-white dark:bg-black/20">
            {SEVERITY.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-500">Karıştırıcı Desen</label>
          <select value={pattern} onChange={(e) => setPattern(e.target.value)} className="w-full text-xs p-2 rounded-lg border bg-white dark:bg-black/20">
            {PATTERNS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-red-100 dark:border-red-900/30">
         <div className="flex justify-between text-[10px] font-bold">
            <span className="text-red-600">Model Kırılma İhtimali (Stress)</span>
            <span>%{confuseFactor}</span>
         </div>
         <input 
           type="range" min="0" max="100" value={confuseFactor} onChange={(e) => setConfuseFactor(Number(e.target.value))}
           className="w-full h-1.5 bg-red-200 rounded-lg appearance-none cursor-pointer accent-red-600"
         />
         <p className="text-[9px] text-gray-400 italic mt-1">
            *Yüksek değerler nesnenin insan gözüyle bile tanınmasını zorlaştırabilir.
         </p>
      </div>
    </div>
  );
}
