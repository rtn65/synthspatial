
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import {useSetAtom} from 'jotai';
import {useState, useEffect} from 'react';
import {EditPromptAtom} from './atoms';

const TERRAINS = ['Şehir Merkezi', 'Ormanlık Alan', 'Çöl', 'Sahil Şeridi', 'Dağlık Bölge'];
const SENSORS = ['Optik (RGB)', 'SAR (Sentetik Açıklıklı Radar)', 'Kızılötesi (False Color)', 'LIDAR Yükseklik Haritası'];
const RESOLUTIONS = ['30cm (Yüksek)', '1m (Orta)', '10m (Sentinel/Landsat)'];
const FEATURES = ['Binalar', 'Yollar', 'Su Kaynakları', 'Bitki Örtüsü', 'Araçlar'];

export function RemoteSensingControls() {
  const setPrompt = useSetAtom(EditPromptAtom);
  
  const [terrain, setTerrain] = useState(TERRAINS[0]);
  const [sensor, setSensor] = useState(SENSORS[0]);
  const [res, setRes] = useState(RESOLUTIONS[0]);
  const [feature, setFeature] = useState(FEATURES[0]);

  useEffect(() => {
    const prompt = `Satellite remote sensing imagery of ${terrain}. 
    Sensor Type: ${sensor}. 
    Ground Resolution: ${res}. 
    Highlight Feature: ${feature}. 
    Orthorectified top-down nadir view, geospatial analysis aesthetic.`;
    setPrompt(prompt);
  }, [terrain, sensor, res, feature, setPrompt]);

  return (
    <div className="flex flex-col gap-4 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800">
      <div className="text-[10px] font-black uppercase tracking-widest text-blue-700 dark:text-blue-400 mb-2">🛰️ Uydu ve Haritalama</div>
      
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-500">Arazi Tipi</label>
        <select value={terrain} onChange={(e) => setTerrain(e.target.value)} className="w-full text-xs p-2 rounded-lg border bg-white dark:bg-black/20">
          {TERRAINS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-500">Sensör Tipi</label>
        <select value={sensor} onChange={(e) => setSensor(e.target.value)} className="w-full text-xs p-2 rounded-lg border bg-white dark:bg-black/20">
          {SENSORS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
         <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500">Çözünürlük</label>
            <select value={res} onChange={(e) => setRes(e.target.value)} className="w-full text-xs p-2 rounded-lg border bg-white dark:bg-black/20">
            {RESOLUTIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
        </div>
        <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500">Vurgulanan Özellik</label>
            <select value={feature} onChange={(e) => setFeature(e.target.value)} className="w-full text-xs p-2 rounded-lg border bg-white dark:bg-black/20">
            {FEATURES.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
        </div>
      </div>
    </div>
  );
}
