
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import {useSetAtom} from 'jotai';
import {useState, useEffect} from 'react';
import {EditPromptAtom} from './atoms';

const SCENARIOS = ['Havaalanı Terminali', 'Otopark', 'Depo Girişi', 'Şehir Meydanı', 'Ofis Koridoru'];
const TIME = ['Gündüz', 'Gece', 'Alacakaranlık', 'Sisli'];
const THREATS = ['Normal Aktivite', 'Terk Edilmiş Paket', 'İzinsiz Giriş', 'Kalabalık Toplanması', 'Yangın Başlangıcı'];
const CAMERA_MODES = ['CCTV Renkli', 'Kızılötesi (IR)', 'Termal', 'Plaka Tanıma (LPR)'];

export function SecurityControls() {
  const setPrompt = useSetAtom(EditPromptAtom);
  
  const [scenario, setScenario] = useState(SCENARIOS[0]);
  const [time, setTime] = useState(TIME[1]);
  const [threat, setThreat] = useState(THREATS[0]);
  const [mode, setMode] = useState(CAMERA_MODES[0]);

  useEffect(() => {
    const prompt = `Security surveillance footage of a ${scenario}. 
    Time/Weather: ${time}. 
    Camera Mode: ${mode}. 
    Detected Event: ${threat}. 
    Low quality CCTV aesthetic, digital grain, timestamps overlay.`;
    setPrompt(prompt);
  }, [scenario, time, threat, mode, setPrompt]);

  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700">
      <div className="text-[10px] font-black uppercase tracking-widest text-gray-700 dark:text-gray-400 mb-2">🛡️ Güvenlik Senaryoları</div>
      
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-500">Mekan</label>
        <select value={scenario} onChange={(e) => setScenario(e.target.value)} className="w-full text-xs p-2 rounded-lg border bg-white dark:bg-black/20">
          {SCENARIOS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500">Zaman</label>
            <select value={time} onChange={(e) => setTime(e.target.value)} className="w-full text-xs p-2 rounded-lg border bg-white dark:bg-black/20">
            {TIME.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
        </div>
        <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500">Kamera Modu</label>
            <select value={mode} onChange={(e) => setMode(e.target.value)} className="w-full text-xs p-2 rounded-lg border bg-white dark:bg-black/20">
            {CAMERA_MODES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-500">Tehdit Simülasyonu</label>
        <select value={threat} onChange={(e) => setThreat(e.target.value)} className="w-full text-xs p-2 rounded-lg border bg-white dark:bg-black/20 text-red-600 font-bold bg-red-50">
          {THREATS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
    </div>
  );
}
