
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import {useAtom, useSetAtom} from 'jotai';
import {useEffect} from 'react';
import {Prompt} from './Prompt';
import {
  ActiveSectorAtom,
  BatchCountAtom,
  BumpSessionAtom,
  CameraAngleAtom,
  EditPromptAtom,
  ImageSentAtom,
  ImageSrcAtom,
  IsChainedModeAtom,
  IsBackgroundReplacementModeAtom,
  IsGalleryPanelOpenAtom,
  IsHistoryPanelOpenAtom,
  IsUploadedImageAtom,
  MinQualityThresholdAtom,
  SelectedBackgroundPresetAtom,
  IsInputPanelOpenAtom,
  SynthesisModelAtom,
} from './atoms';
import {useResetState} from './hooks';
import {BG_PRESETS} from './consts';
import {SectorSelector} from './SectorSelector';
import {AgricultureControls} from './AgricultureControls';
import {ManufacturingControls} from './ManufacturingControls';
import {SecurityControls} from './SecurityControls';
import {RemoteSensingControls} from './RemoteSensingControls';
import {RedTeamControls} from './RedTeamControls';
import {DataDreamerControls} from './DataDreamerControls';
import {FalAIControls} from './FalAIControls';

const CAMERA_ANGLES = [
  { id: 'default', label: 'Standart', icon: '📷' },
  { id: 'wide', label: 'Geniş Açı', icon: '🖼️' },
  { id: 'top-down', label: 'Kuş Bakışı', icon: '🚁' },
  { id: 'low-angle', label: 'Alçak Açı', icon: '📐' },
  { id: 'close-up', label: 'Yakın Çekim', icon: '🔍' },
  { id: 'cinematic', label: 'Sinematik', icon: '🎬' },
];

export function InputPanel() {
  const [, setImageSrc] = useAtom(ImageSrcAtom);
  const [batchCount, setBatchCount] = useAtom(BatchCountAtom);
  const [isChainedMode, setIsChainedMode] = useAtom(IsChainedModeAtom);
  const [isBgReplaceMode, setIsBgReplaceMode] = useAtom(IsBackgroundReplacementModeAtom);
  const [cameraAngle, setCameraAngle] = useAtom(CameraAngleAtom);
  const [, setEditPrompt] = useAtom(EditPromptAtom);
  const [selectedPreset, setSelectedPreset] = useAtom(SelectedBackgroundPresetAtom);
  const setIsUploadedImage = useSetAtom(IsUploadedImageAtom);
  const setBumpSession = useSetAtom(BumpSessionAtom);
  const setImageSent = useSetAtom(ImageSentAtom);
  const [isOpen, setIsOpen] = useAtom(IsInputPanelOpenAtom);
  const [activeSector] = useAtom(ActiveSectorAtom);
  const [model] = useAtom(SynthesisModelAtom);
  const [minQuality, setMinQuality] = useAtom(MinQualityThresholdAtom);
  const resetState = useResetState();

  const [isHistoryOpen, setIsHistoryOpen] = useAtom(IsHistoryPanelOpenAtom);
  const [isGalleryOpen, setIsGalleryOpen] = useAtom(IsGalleryPanelOpenAtom);

  return (
    <aside className={`input-panel-container transition-all duration-300 ${isOpen ? '' : 'closed'}`}>
      <div className="panel-toggles flex items-center justify-between px-4 py-2 border-b bg-[var(--bg-color-secondary)]">
        <div className="flex gap-2">
          <button onClick={() => setIsGalleryOpen(!isGalleryOpen)} className="secondary !p-2 h-9 w-9 rounded-xl hover:bg-white transition-all shadow-sm" title="Galeri">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
          </button>
          <button onClick={() => setIsHistoryOpen(!isHistoryOpen)} className="secondary !p-2 h-9 w-9 rounded-xl hover:bg-white transition-all shadow-sm" title="Geçmiş">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="10" /></svg>
          </button>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-[var(--text-color-secondary)] hover:text-[var(--text-color-primary)] p-1.5 rounded-lg hover:bg-white transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      
      <div className="input-panel overflow-y-auto grow">
        {/* External Model Specific UI */}
        <FalAIControls />

        {model === 'runway-gen3' && (
          <div className="p-4 bg-black text-white rounded-2xl border border-gray-800 mb-4 animate-in fade-in duration-300">
             <div className="flex items-center gap-2 mb-3">
               <span className="text-xl">🚀</span>
               <span className="text-[10px] font-black uppercase tracking-widest">Runway Gen-3 Alpha</span>
             </div>
             <div className="p-3 bg-gray-900 rounded-xl border border-gray-800 text-[10px] font-medium leading-relaxed opacity-80">
               *Runway entegrasyonu "Video Sentezi" modunda aktifleşir. Motion Brush ve gelişmiş kamera kontrolü Gemini asistanıyla otomatik optimize edilir.
             </div>
          </div>
        )}

        <div className="input-sources">
          <div className="input-sources-label text-[var(--accent-color)] mb-2 font-black tracking-[0.2em]">İŞ İSTASYONU MODU</div>
          <SectorSelector />
        </div>

        {activeSector === 'agriculture' && <AgricultureControls />}
        {activeSector === 'manufacturing' && <ManufacturingControls />}
        {activeSector === 'security' && <SecurityControls />}
        {activeSector === 'remote_sensing' && <RemoteSensingControls />}
        {activeSector === 'red_team' && <RedTeamControls />}
        {activeSector === 'data_dreamer' && <DataDreamerControls />}

        {activeSector === 'general' && (
          <div className="input-sources">
            <div className="input-sources-buttons">
              <label className="button upload-button grow cursor-pointer border-dashed border-2 hover:border-[var(--accent-color)] hover:bg-[var(--accent-color-focus)] transition-all h-14 rounded-2xl flex items-center justify-center gap-3">
                <input className="hidden" type="file" accept=".jpg, .jpeg, .png, .webp" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      resetState();
                      setImageSrc(e.target?.result as string);
                      setIsUploadedImage(true);
                      setImageSent(false);
                      setBumpSession((prev) => prev + 1);
                    };
                    reader.readAsDataURL(file);
                  }
                }} />
                <div className="bg-[var(--accent-color)] p-2 rounded-lg text-white shadow-lg"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg></div>
                <div className="font-bold text-sm">Görüntü Yükle</div>
              </label>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-5 bg-[var(--bg-color-secondary)] p-5 rounded-3xl border border-[var(--border-color)] shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-black uppercase tracking-wider">Arka Plan Modu</span>
              <span className="text-[10px] text-[var(--text-color-secondary)] font-medium">Nesneleri koru, fonu değiştir</span>
            </div>
            <button className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isBgReplaceMode ? 'bg-[var(--accent-color)] shadow-[0_0_10px_rgba(26,115,232,0.4)]' : 'bg-gray-400'}`} onClick={() => setIsBgReplaceMode(!isBgReplaceMode)}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${isBgReplaceMode ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <div className="flex flex-col gap-3 border-t border-[var(--border-color)]/50 pt-5">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-color-secondary)]">Eşzamanlı Varyasyon</span>
              <span className="text-sm font-black text-[var(--accent-color)] font-mono">{batchCount} Adet</span>
            </div>
            <input type="range" min="1" max="8" step="1" value={batchCount} onChange={(e) => setBatchCount(parseInt(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--accent-color)]" />
          </div>
          <div className="flex flex-col gap-3 border-t border-[var(--border-color)]/50 pt-5">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-color-secondary)]">Kalite Eşiği</span>
              <span className="text-sm font-black text-[var(--accent-color)] font-mono">{minQuality}%</span>
            </div>
            <input type="range" min="0" max="100" step="5" value={minQuality} onChange={(e) => setMinQuality(parseInt(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--accent-color)]" />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="input-sources-label text-[10px] font-black tracking-widest opacity-60">KAMERA & PERSPEKTİF</div>
          <div className="grid grid-cols-3 gap-2">
            {CAMERA_ANGLES.map((angle) => (
              <button key={angle.id} className={`flex flex-col items-center justify-center py-2.5 rounded-2xl border-2 transition-all group ${cameraAngle === angle.id ? 'bg-[var(--accent-color)] text-white border-[var(--accent-color)] shadow-lg scale-[1.02]' : 'bg-[var(--bg-color)] border-transparent hover:border-[var(--border-color)] hover:bg-gray-50'}`} onClick={() => setCameraAngle(angle.id as any)}>
                <span className={`text-xl transition-transform group-hover:scale-110 ${cameraAngle === angle.id ? 'opacity-100' : 'opacity-60'}`}>{angle.icon}</span>
                <span className="text-[9px] mt-1 font-black uppercase tracking-tighter">{angle.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t border-[var(--border-color)] mt-4">

          <Prompt />
        </div>
      </div>
    </aside>
  );
}
