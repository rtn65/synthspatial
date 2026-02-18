
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import React, {useMemo} from 'react';
import {useAtom} from 'jotai';
import {IsTutorialActiveAtom, TutorialStepAtom} from './atoms';

interface TutorialStep {
  title: string;
  description: string;
  highlightClass?: string;
  position: 'center' | 'bottom' | 'top' | 'left' | 'right';
  icon: string;
}

const STEPS: TutorialStep[] = [
  {
    title: "SynthEngine Pro'ya Hoş Geldiniz",
    description: "Dünyanın en gelişmiş yapay zeka modellerini kullanarak görüntü ve video sentezleme yolculuğuna başlamak üzeresiniz. Bu kısa rehber size temel araçları tanıtacak.",
    position: 'center',
    icon: '🚀'
  },
  {
    title: "Yapay Zeka Motorları",
    description: "Buradan ihtiyacınıza göre farklı modeller seçebilirsiniz. Nano Banana hızlı düzenlemeler için, Imagen 4 sanatsal çalışmalar için, Veo 3.1 ise video üretimi için optimize edilmiştir.",
    highlightClass: 'model-selector-tutorial',
    position: 'bottom',
    icon: '🧠'
  },
  {
    title: "Görüntü Düzenleme Alanı",
    description: "Buradaki fırça ve seçim araçlarını kullanarak görüntünün hangi bölgelerinde değişiklik yapılacağını belirleyebilirsiniz. Sadece maskelediğiniz alanlar AI tarafından işlenir.",
    highlightClass: 'roi-toolbar-tutorial',
    position: 'right',
    icon: '🖌️'
  },
  {
    title: "Prompt Mühendisliği",
    description: "Buraya AI'dan ne yapmasını istediğinizi yazın. Ne kadar detaylı yazarsanız sonuç o kadar tatmin edici olur. Örneğin: 'Arka plana karlı dağlar ekle'.",
    highlightClass: 'prompt-input-tutorial',
    position: 'top',
    icon: '✍️'
  },
  {
    title: "Sentezleme ve Varyasyon",
    description: "Komutunuzu hazırladıktan sonra bu butona basarak sentezlemeyi başlatın. Ayarlar panelinden kaç farklı varyasyon üretileceğini seçebilirsiniz.",
    highlightClass: 'send-button-tutorial',
    position: 'top',
    icon: '⚡'
  },
  {
    title: "Tebrikler!",
    description: "Artık SynthEngine Pro'yu kullanmaya hazırsınız. Yardıma ihtiyaç duyarsanız yukarıdaki soru işareti ikonuna basarak bu rehberi tekrar başlatabilirsiniz.",
    position: 'center',
    icon: '🎉'
  }
];

export function Tutorial() {
  const [isActive, setIsActive] = useAtom(IsTutorialActiveAtom);
  const [currentStep, setCurrentStep] = useAtom(TutorialStepAtom);

  const step = STEPS[currentStep];

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      finishTutorial();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const finishTutorial = () => {
    localStorage.setItem('tutorialSeen', 'true');
    setIsActive(false);
  };

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-[1000] pointer-events-none flex items-center justify-center">
      {/* Dimmed Overlay */}
      <div className="absolute inset-0 bg-black/60 pointer-events-auto backdrop-blur-[2px]" />

      {/* Tutorial Card */}
      <div className={`
        relative bg-white dark:bg-gray-900 w-[90%] max-w-md p-6 rounded-2xl shadow-2xl pointer-events-auto
        animate-in fade-in zoom-in-95 duration-300
        border border-gray-200 dark:border-gray-800
        ${step.position === 'center' ? 'm-auto' : ''}
      `}>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">{step.icon}</span>
          <div>
            <h3 className="text-lg font-black leading-tight text-gray-900 dark:text-white">
              {step.title}
            </h3>
            <p className="text-[10px] font-bold uppercase text-blue-500 tracking-widest mt-0.5">
              Adım {currentStep + 1} / {STEPS.length}
            </p>
          </div>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
          {step.description}
        </p>

        <div className="flex justify-between items-center">
          <button 
            onClick={finishTutorial}
            className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
          >
            Rehberi Atla
          </button>
          
          <div className="flex gap-2">
            {currentStep > 0 && (
              <button 
                onClick={handleBack}
                className="secondary !px-4 !py-1.5 text-xs font-bold"
              >
                Geri
              </button>
            )}
            <button 
              onClick={handleNext}
              className="send-button !px-6 !py-1.5 text-xs font-bold !rounded-full shadow-lg shadow-blue-500/20"
            >
              {currentStep === STEPS.length - 1 ? 'Tamamla' : 'Sonraki'}
            </button>
          </div>
        </div>

        {/* Pointer for highlighted elements (Simulated) */}
        {step.highlightClass && (
           <div className="absolute -top-10 left-1/2 -translate-x-1/2 animate-bounce text-2xl hidden md:block">
             👇
           </div>
        )}
      </div>

      {/* CSS Injection for highlighting via a transparent punch-hole could be done here 
          but adding semantic classes to components is cleaner for this app. */}
      <style dangerouslySetInnerHTML={{ __html: `
        ${step.highlightClass ? `
          .${step.highlightClass} {
            position: relative;
            z-index: 1001 !important;
            box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.6) !important;
            pointer-events: none;
            border: 2px solid #3b82f6 !important;
            border-radius: 999px;
            animation: spotlight-pulse 2s infinite;
          }
        ` : ''}

        @keyframes spotlight-pulse {
          0% { border-color: #3b82f6; box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.6), 0 0 0 0px rgba(59, 130, 246, 0.4); }
          70% { border-color: #3b82f6; box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.6), 0 0 0 15px rgba(59, 130, 246, 0); }
          100% { border-color: #3b82f6; box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.6), 0 0 0 0px rgba(59, 130, 246, 0); }
        }
      `}} />
    </div>
  );
}
