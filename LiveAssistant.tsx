
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import React, {useEffect, useRef, useState} from 'react';
import {useAtom, useSetAtom} from 'jotai';
import {GoogleGenAI, Modality} from '@google/genai';
import {
  IsLiveAssistantActiveAtom, 
  LiveTranscriptAtom, 
  EditPromptAtom, 
  CurrentQualityMetadataAtom,
  ActiveProjectHistoryAtom
} from './atoms';
import {HistoryItem} from './Types';

export function LiveAssistant() {
  const [isActive, setIsActive] = useAtom(IsLiveAssistantActiveAtom);
  const [transcript, setTranscript] = useAtom(LiveTranscriptAtom);
  const setPrompt = useSetAtom(EditPromptAtom);
  const [qualityMetadata] = useAtom(CurrentQualityMetadataAtom);
  const [history] = useAtom(ActiveProjectHistoryAtom);
  const [suggestion, setSuggestion] = useAtom(LiveTranscriptAtom); // Re-using transcript atom for feedback display for now, or create a new one?
  // Actually, let's create a local state for suggestions to not mess up the transcript
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const sessionRef = useRef<any>(null);
  const previousQualityRef = useRef<number | null>(null);

  // Analyze quality when it changes
  useEffect(() => {
    if (qualityMetadata && qualityMetadata.qualityScore !== previousQualityRef.current) {
      previousQualityRef.current = qualityMetadata.qualityScore;
      analyzeAndSuggest(qualityMetadata.qualityScore, qualityMetadata.qualityFeedback || '');
    }
  }, [qualityMetadata]);

  const analyzeAndSuggest = async (score: number, rawFeedback: string) => {
    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
      const recentPrompts = history.slice(0, 3).map(h => h.promptState.editPrompt).join(" | ");
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `User generated an image. Score: ${score}/100. System Feedback: ${rawFeedback}.
        Recent Prompts: ${recentPrompts}.
        
        Provide a short, 1-sentence actionable tip to improve the prompt for better photorealism or adherence.
        Start with "💡 Tip:"`,
      });
      
      const tip = response.text || "Try adding more descriptive adjectives.";
      setFeedback(tip);
      
      // If live session is active, maybe we can make it speak this tip?
      // For now, just displaying it is good.
    } catch (e) {
      console.error("Feedback generation failed", e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startLiveSession = async () => {
    try {
      const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const session = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
             console.log("Live connection opened");
          },
          onmessage: async (message) => {
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              setTranscript(prev => prev + text);
              if (text.trim()) {
                 // Simple command parsing or just appending
                 // For a real "Assistant", we might want to parse intent.
                 // But for now, let's just append to prompt if it looks like a description
                 setPrompt(prev => (prev + " " + text).trim());
              }
            }
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          systemInstruction: 'You are a creative visual assistant. Listen to the user\'s description and help them build a detailed image generation prompt. If they ask for changes, update the prompt accordingly.'
        }
      });
      sessionRef.current = await session;
      setIsActive(true);
    } catch (e) {
      console.error("Live Assistant failed", e);
      alert("Microphone access failed or API error. Check console.");
    }
  };

  const stopLiveSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    setIsActive(false);
  };

  return (
    <div className="flex items-center gap-2 relative">
      <button 
        onClick={isActive ? stopLiveSession : startLiveSession}
        className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${isActive ? 'bg-red-50 text-red-600 border-red-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}
      >
        <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-red-500 animate-ping' : 'bg-blue-500'}`}></span>
        <span className="text-[10px] font-bold uppercase tracking-wider">
          {isActive ? 'Dinliyor...' : 'Sesli Asistan'}
        </span>
      </button>
      
      {/* Feedback Popover */}
      {(feedback || isActive) && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-3 z-50 animate-in fade-in slide-in-from-top-2">
          {isActive && (
             <div className="mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
               <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Canlı Transkript</div>
               <div className="text-xs italic text-gray-600 dark:text-gray-300 max-h-20 overflow-y-auto">
                 "{transcript || "Dinleniyor..."}"
               </div>
             </div>
          )}
          
          {feedback && (
            <div>
              <div className="text-[10px] uppercase font-bold text-purple-500 mb-1 flex items-center justify-between">
                <span>Yapay Zeka Önerisi</span>
                <button onClick={() => setFeedback(null)} className="hover:text-red-500">&times;</button>
              </div>
              <div className="text-xs text-gray-700 dark:text-gray-200 font-medium">
                {isAnalyzing ? "Analiz ediliyor..." : feedback}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
