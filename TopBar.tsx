
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import {useAtom, useSetAtom} from 'jotai';
import {ThemeAtom, IsSearchGroundingActiveAtom, SynthesisModelAtom, IsTutorialActiveAtom, TutorialStepAtom, IsInputPanelOpenAtom, IsGuideOpenAtom, IsAnalyticsPanelOpenAtom, UserCreditsAtom} from './atoms';
import {useResetState} from './hooks';
import {ProjectSelector} from './ProjectSelector';
import {ModelSelector} from './ModelSelector';
import {LiveAssistant} from './LiveAssistant';
import {AuthButton} from './AuthButton';
import {Coins, Search, Settings, BarChart2, BookOpen, HelpCircle, Sun, Moon, RotateCcw} from 'lucide-react';

export function TopBar() {
  const resetState = useResetState();
  const [theme, setTheme] = useAtom(ThemeAtom);
  const [isSearch, setIsSearch] = useAtom(IsSearchGroundingActiveAtom);
  const [activeModel] = useAtom(SynthesisModelAtom);
  const setIsTutorialActive = useSetAtom(IsTutorialActiveAtom);
  const setTutorialStep = useSetAtom(TutorialStepAtom);
  const [isInputOpen, setIsInputOpen] = useAtom(IsInputPanelOpenAtom);
  const setIsGuideOpen = useSetAtom(IsGuideOpenAtom);
  const setIsAnalyticsOpen = useSetAtom(IsAnalyticsPanelOpenAtom);
  const [credits] = useAtom(UserCreditsAtom);

  const startTutorial = () => {
    setTutorialStep(0);
    setIsTutorialActive(true);
  };

  return (
    <div className="flex w-full items-center px-6 py-3 border-b justify-between shrink-0 bg-[var(--bg-color)] z-[100] shadow-sm">
      <div className="flex gap-6 items-center">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 bg-[var(--accent-color)] rounded-lg flex items-center justify-center text-[var(--bg-color)] font-bold shadow-sm">S</div>
           <div className="font-bold text-lg tracking-tight text-[var(--text-color-primary)]">SynthEngine<span className="text-[var(--text-color-secondary)] font-normal ml-1">Pro</span></div>
        </div>
        <div className="h-5 w-px bg-[var(--border-color)]" />
        <ProjectSelector />
        <button onClick={resetState} className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-color-secondary)] hover:text-[var(--text-color-primary)] transition-colors">
          <RotateCcw size={14} />
          Reset
        </button>
      </div>
      
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md">
          <Coins size={14} className="text-amber-500" />
          <span className="font-mono text-xs font-medium text-slate-700 dark:text-slate-300">{credits} Credits</span>
        </div>

        <LiveAssistant />
        
        {activeModel.includes('pro') && (
          <button 
            onClick={() => setIsSearch(!isSearch)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${isSearch ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800' : 'bg-transparent text-[var(--text-color-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-color-secondary)]'}`}
          >
            <Search size={14} />
            Grounding {isSearch ? 'ON' : 'OFF'}
          </button>
        )}

        <ModelSelector />
        
        <div className="h-5 w-px bg-[var(--border-color)]" />

        <div className="flex items-center gap-1">
          {!isInputOpen && (
            <button 
              onClick={() => setIsInputOpen(true)}
              className="p-2 rounded-md hover:bg-[var(--bg-color-secondary)] text-[var(--text-color-secondary)] hover:text-[var(--text-color-primary)] transition-colors"
              title="Settings"
            >
              <Settings size={18} />
            </button>
          )}

          <button 
            onClick={() => setIsAnalyticsOpen(true)}
            title="Analytics Dashboard"
            className="p-2 rounded-md hover:bg-[var(--bg-color-secondary)] text-[var(--text-color-secondary)] hover:text-[var(--text-color-primary)] transition-colors"
          >
            <BarChart2 size={18} />
          </button>

          <button 
            onClick={() => setIsGuideOpen(true)}
            title="Tutorials & Guides"
            className="p-2 rounded-md hover:bg-[var(--bg-color-secondary)] text-[var(--text-color-secondary)] hover:text-[var(--text-color-primary)] transition-colors"
          >
            <BookOpen size={18} />
          </button>

          <button 
            onClick={startTutorial}
            title="Help"
            className="p-2 rounded-md hover:bg-[var(--bg-color-secondary)] text-[var(--text-color-secondary)] hover:text-[var(--text-color-primary)] transition-colors"
          >
            <HelpCircle size={18} />
          </button>

          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-md hover:bg-[var(--bg-color-secondary)] text-[var(--text-color-secondary)] hover:text-[var(--text-color-primary)] transition-colors">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          <div className="h-5 w-px bg-[var(--border-color)] mx-2" />
          
          <AuthButton />
        </div>
      </div>
    </div>
  );
}
