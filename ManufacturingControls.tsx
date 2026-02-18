
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import {useSetAtom} from 'jotai';
import {useState, useEffect} from 'react';
import {EditPromptAtom} from './atoms';

const MATERIALS = ['Çelik', 'Alüminyum', 'Plastik Polimer', 'Karbon Fiber', 'Seramik', 'Cam'];
const DEFECTS = ['Kusursuz', 'Yüzey Çiziği', 'Pas/Korozyon', 'Çatlak', 'Hatalı Boya', 'Kaynak Hatası'];
const LIGHTING = ['Stüdyo', 'Endüstriyel Neon', 'Düşük Işık', 'UV Muayene Işığı'];

export function ManufacturingControls() {
  const setPrompt = useSetAtom(EditPromptAtom);
  
  const [material, setMaterial] = useState(MATERIALS[0]);
  const [defect, setDefect] = useState(DEFECTS[0]);
  const [lighting, setLighting] = useState(LIGHTING[1]);
  const [zoom, setZoom] = useState('Makro');

  useEffect(() => {
    const prompt = `Industrial quality control close-up of a ${material} component. 
    Defect Status: ${defect}. 
    Lighting Condition: ${lighting}. 
    View: ${zoom}. 
    Show microscopic surface details and material texture.`;
    setPrompt(prompt);
  }, [material, defect, lighting, zoom, setPrompt]);

  return (
    <div className="flex flex-col gap-4 p-4 bg-orange-50/50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-800">
      <div className="text-[10px] font-black uppercase tracking-widest text-orange-700 dark:text-orange-400 mb-2">🏭 Üretim Parametreleri</div>
      
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-500">Materyal</label>
        <select value={material} onChange={(e) => setMaterial(e.target.value)} className="w-full text-xs p-2 rounded-lg border bg-white dark:bg-black/20">
          {MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-500">Kusur/Hata Simülasyonu</label>
        <select value={defect} onChange={(e) => setDefect(e.target.value)} className="w-full text-xs p-2 rounded-lg border bg-white dark:bg-black/20 text-red-500 font-bold border-red-200">
          {DEFECTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-500">Işıklandırma</label>
          <select value={lighting} onChange={(e) => setLighting(e.target.value)} className="w-full text-xs p-2 rounded-lg border bg-white dark:bg-black/20">
            {LIGHTING.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
         <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-500">Yakınlık</label>
          <select value={zoom} onChange={(e) => setZoom(e.target.value)} className="w-full text-xs p-2 rounded-lg border bg-white dark:bg-black/20">
            <option>Genel Bakış</option>
            <option>Yakın</option>
            <option>Makro</option>
            <option>Mikroskobik</option>
          </select>
        </div>
      </div>
    </div>
  );
}
