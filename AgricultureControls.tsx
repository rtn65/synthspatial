
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import {useSetAtom} from 'jotai';
import {useState, useEffect} from 'react';
import {EditPromptAtom} from './atoms';

const CROPS = ['Mısır', 'Buğday', 'Soya', 'Pamuk', 'Üzüm Bağı', 'Pirinç'];
const STAGES = ['Filizlenme', 'Vejetatif', 'Çiçeklenme', 'Olgunlaşma', 'Hasat'];
const HEALTH_STATUS = ['Sağlıklı', 'Azot Eksikliği', 'Kuraklık Stresi', 'Mantar Hastalığı', 'Böcek İstilası'];
const SOIL_TYPES = ['Killi', 'Kumlu', 'Kireçli', 'Humuslu'];

export function AgricultureControls() {
  const setPrompt = useSetAtom(EditPromptAtom);
  
  const [crop, setCrop] = useState(CROPS[0]);
  const [stage, setStage] = useState(STAGES[1]);
  const [health, setHealth] = useState(HEALTH_STATUS[0]);
  const [soil, setSoil] = useState(SOIL_TYPES[0]);
  const [irrigation, setIrrigation] = useState(50);

  useEffect(() => {
    const prompt = `Aerial agricultural view of a ${crop} field during ${stage} stage. 
    Soil Type: ${soil}. 
    Plant Health Status: ${health}. 
    Irrigation level: ${irrigation}%. 
    Detailed hyperspectral vegetation index visualization.`;
    setPrompt(prompt);
  }, [crop, stage, health, soil, irrigation, setPrompt]);

  return (
    <div className="flex flex-col gap-4 p-4 bg-green-50/50 dark:bg-green-900/10 rounded-2xl border border-green-100 dark:border-green-800">
      <div className="text-[10px] font-black uppercase tracking-widest text-green-700 dark:text-green-400 mb-2">🌱 Mahsul Parametreleri</div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-500">Ürün Tipi</label>
          <select value={crop} onChange={(e) => setCrop(e.target.value)} className="w-full text-xs p-2 rounded-lg border bg-white dark:bg-black/20">
            {CROPS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-500">Gelişim Evresi</label>
          <select value={stage} onChange={(e) => setStage(e.target.value)} className="w-full text-xs p-2 rounded-lg border bg-white dark:bg-black/20">
            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-500">Sağlık Durumu (NDVI Simülasyonu)</label>
        <select value={health} onChange={(e) => setHealth(e.target.value)} className="w-full text-xs p-2 rounded-lg border bg-white dark:bg-black/20 text-red-600 font-bold">
          {HEALTH_STATUS.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
      </div>

      <div className="space-y-2">
         <div className="flex justify-between text-[10px] font-bold">
            <span>Sulama Seviyesi</span>
            <span>%{irrigation}</span>
         </div>
         <input 
           type="range" min="0" max="100" value={irrigation} onChange={(e) => setIrrigation(Number(e.target.value))}
           className="w-full h-1.5 bg-green-200 rounded-lg appearance-none cursor-pointer accent-green-600"
         />
      </div>
    </div>
  );
}
