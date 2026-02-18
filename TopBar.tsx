
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import {useAtom, useSetAtom} from 'jotai';
import {ThemeAtom, IsSearchGroundingActiveAtom, SynthesisModelAtom, IsTutorialActiveAtom, TutorialStepAtom, IsInputPanelOpenAtom, IsGuideOpenAtom} from './atoms';
import {useResetState} from './hooks';
import {ProjectSelector} from './ProjectSelector';
import {ModelSelector} from './ModelSelector';
import {LiveAssistant} from './LiveAssistant';

export function TopBar() {
  const resetState = useResetState();
  const [theme, setTheme] = useAtom(ThemeAtom);
  const [isSearch, setIsSearch] = useAtom(IsSearchGroundingActiveAtom);
  const [activeModel] = useAtom(SynthesisModelAtom);
  const setIsTutorialActive = useSetAtom(IsTutorialActiveAtom);
  const setTutorialStep = useSetAtom(TutorialStepAtom);
  const [isInputOpen, setIsInputOpen] = useAtom(IsInputPanelOpenAtom);
  const setIsGuideOpen = useSetAtom(IsGuideOpenAtom);

  const startTutorial = () => {
    setTutorialStep(0);
    setIsTutorialActive(true);
  };

  return (
    <div className="flex w-full items-center px-4 py-2 border-b justify-between shrink-0 bg-[var(--bg-color)] z-[100] shadow-sm">
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-[var(--accent-color)] rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-[var(--accent-color-focus)]">S</div>
           <div className="font-black text-base tracking-tighter text-[var(--text-color-primary)]">SynthEngine</div>
        </div>
        <div className="h-4 w-px bg-[var(--border-color)]" />
        <ProjectSelector />
        <button onClick={resetState} className="text-[10px] font-black uppercase text-[var(--text-color-secondary)] hover:text-[var(--accent-color)] transition-colors">Sıfırla</button>
      </div>
      
      <div className="flex gap-4 items-center">
        <LiveAssistant />
        
        {activeModel.includes('pro') && (
          <button 
            onClick={() => setIsSearch(!isSearch)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black border transition-all ${isSearch ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}
          >
            🔍 Grounding {isSearch ? 'AÇIK' : 'KAPALI'}
          </button>
        )}

        <ModelSelector />
        
        <div className="h-4 w-px bg-[var(--border-color)]" />

        <div className="flex items-center gap-1.5">
          {!isInputOpen && (
            <button 
              onClick={() => setIsInputOpen(true)}
              className="p-2 rounded-xl hover:bg-[var(--bg-color-secondary)] text-[var(--accent-color)] transition-all font-black text-[10px] flex items-center gap-2 border border-[var(--accent-color)]"
            >
              ⚙️ AYARLAR
            </button>
          )}

          <button 
            onClick={() => setIsGuideOpen(true)}
            title="Mühendislik Rehberi"
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-base"
          >
            📖
          </button>

          <button 
            onClick={startTutorial}
            title="Yardım / Rehber"
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-base"
          >
            ❓
          </button>

          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-base">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </div>
  );
}
