
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
import {X, Image as ImageIcon, History, Upload, Camera, Maximize, ArrowDownToLine, ArrowUpFromLine, ZoomIn, Film} from 'lucide-react';

const CAMERA_ANGLES = [
  { id: 'default', label: 'Standard', icon: <Camera size={16} /> },
  { id: 'wide', label: 'Wide Angle', icon: <Maximize size={16} /> },
  { id: 'top-down', label: 'Top-Down', icon: <ArrowDownToLine size={16} /> },
  { id: 'low-angle', label: 'Low Angle', icon: <ArrowUpFromLine size={16} /> },
  { id: 'close-up', label: 'Close-Up', icon: <ZoomIn size={16} /> },
  { id: 'cinematic', label: 'Cinematic', icon: <Film size={16} /> },
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
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-color)] bg-[var(--bg-color)]">
        <div className="flex gap-2">
          <button onClick={() => setIsGalleryOpen(!isGalleryOpen)} className="p-2 rounded-md hover:bg-[var(--bg-color-secondary)] text-[var(--text-color-secondary)] hover:text-[var(--text-color-primary)] transition-colors" title="Gallery">
            <ImageIcon size={18} />
          </button>
          <button onClick={() => setIsHistoryOpen(!isHistoryOpen)} className="p-2 rounded-md hover:bg-[var(--bg-color-secondary)] text-[var(--text-color-secondary)] hover:text-[var(--text-color-primary)] transition-colors" title="History">
            <History size={18} />
          </button>
        </div>
        <button onClick={() => setIsOpen(false)} className="p-2 rounded-md hover:bg-[var(--bg-color-secondary)] text-[var(--text-color-secondary)] hover:text-[var(--text-color-primary)] transition-colors">
          <X size={18} />
        </button>
      </div>
      
      <div className="input-panel overflow-y-auto grow">
        {/* External Model Specific UI */}
        <FalAIControls />

        {model === 'runway-gen3' && (
          <div className="p-4 bg-slate-900 text-slate-50 rounded-xl border border-slate-800 mb-4">
             <div className="flex items-center gap-2 mb-2">
               <Film size={16} className="text-indigo-400" />
               <span className="micro-label !text-indigo-400">Runway Gen-3 Alpha</span>
             </div>
             <div className="text-xs text-slate-400 leading-relaxed">
               Runway integration is active in "Video Synthesis" mode. Motion Brush and advanced camera controls are automatically optimized by the Gemini assistant.
             </div>
          </div>
        )}

        <div className="mb-6">
          <div className="micro-label mb-3">Workstation Mode</div>
          <SectorSelector />
        </div>

        {activeSector === 'agriculture' && <AgricultureControls />}
        {activeSector === 'manufacturing' && <ManufacturingControls />}
        {activeSector === 'security' && <SecurityControls />}
        {activeSector === 'remote_sensing' && <RemoteSensingControls />}
        {activeSector === 'red_team' && <RedTeamControls />}
        {activeSector === 'data_dreamer' && <DataDreamerControls />}

        {activeSector === 'general' && (
          <div className="mb-6">
            <label className="cursor-pointer border border-dashed border-[var(--border-color)] hover:border-[var(--accent-color)] hover:bg-[var(--accent-color-focus)] transition-all h-24 rounded-xl flex flex-col items-center justify-center gap-2">
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
              <div className="bg-[var(--bg-color-secondary)] p-2 rounded-md text-[var(--text-color-secondary)] border border-[var(--border-color)]">
                <Upload size={16} />
              </div>
              <div className="text-xs font-medium text-[var(--text-color-secondary)]">Upload Source Image</div>
            </label>
          </div>
        )}

        <div className="flex flex-col gap-5 bg-[var(--bg-color-secondary)] p-5 rounded-xl border border-[var(--border-color)] mb-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-[var(--text-color-primary)]">Background Mode</span>
              <span className="text-[11px] text-[var(--text-color-secondary)]">Preserve subjects, replace background</span>
            </div>
            <button className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:ring-offset-2 ${isBgReplaceMode ? 'bg-[var(--accent-color)]' : 'bg-slate-200 dark:bg-slate-700'}`} onClick={() => setIsBgReplaceMode(!isBgReplaceMode)}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${isBgReplaceMode ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <div className="flex flex-col gap-3 border-t border-[var(--border-color)] pt-4">
            <div className="flex justify-between items-end">
              <span className="micro-label">Batch Size</span>
              <span className="font-mono text-xs font-semibold text-[var(--accent-color)]">{batchCount}</span>
            </div>
            <input type="range" min="1" max="8" step="1" value={batchCount} onChange={(e) => setBatchCount(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[var(--accent-color)]" />
          </div>
          <div className="flex flex-col gap-3 border-t border-[var(--border-color)] pt-4">
            <div className="flex justify-between items-end">
              <span className="micro-label">Quality Threshold</span>
              <span className="font-mono text-xs font-semibold text-[var(--accent-color)]">{minQuality}%</span>
            </div>
            <input type="range" min="0" max="100" step="5" value={minQuality} onChange={(e) => setMinQuality(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[var(--accent-color)]" />
          </div>
        </div>

        <div className="flex flex-col gap-3 mb-6">
          <div className="micro-label">Camera & Perspective</div>
          <div className="grid grid-cols-3 gap-2">
            {CAMERA_ANGLES.map((angle) => (
              <button key={angle.id} className={`flex flex-col items-center justify-center py-3 rounded-xl border transition-all ${cameraAngle === angle.id ? 'bg-[var(--accent-color)] text-[var(--bg-color)] border-[var(--accent-color)] shadow-sm' : 'bg-[var(--bg-color-secondary)] text-[var(--text-color-secondary)] border-[var(--border-color)] hover:border-[var(--text-color-primary)] hover:text-[var(--text-color-primary)]'}`} onClick={() => setCameraAngle(angle.id as any)}>
                <span className={`mb-1.5 ${cameraAngle === angle.id ? 'opacity-100' : 'opacity-70'}`}>{angle.icon}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider">{angle.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t border-[var(--border-color)]">
          <Prompt />
        </div>
      </div>
    </aside>
  );
}
