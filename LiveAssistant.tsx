
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import React, {useEffect, useRef} from 'react';
import {useAtom, useSetAtom} from 'jotai';
import {GoogleGenAI, Modality} from '@google/genai';
import {IsLiveAssistantActiveAtom, LiveTranscriptAtom, EditPromptAtom} from './atoms';

export function LiveAssistant() {
  const [isActive, setIsActive] = useAtom(IsLiveAssistantActiveAtom);
  const [transcript, setTranscript] = useAtom(LiveTranscriptAtom);
  const setPrompt = useSetAtom(EditPromptAtom);
  const sessionRef = useRef<any>(null);

  const startLiveSession = async () => {
    try {
      const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const session = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
             console.log("Live connection opened");
             // Minimal implementation for transcription
          },
          onmessage: async (message) => {
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              setTranscript(prev => prev + text);
              setPrompt(prev => (prev + " " + text).trim());
            }
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          systemInstruction: 'Sen görsel bir editör asistanısın. Kullanıcının söylediklerini dinle ve bunları görüntü düzenleme komutlarına dönüştür.'
        }
      });
      sessionRef.current = await session;
      setIsActive(true);
    } catch (e) {
      console.error("Live Assistant failed", e);
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
    <div className="flex items-center gap-2">
      <button 
        onClick={isActive ? stopLiveSession : startLiveSession}
        className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${isActive ? 'bg-red-50 text-red-600 border-red-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}
      >
        <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-red-500 animate-ping' : 'bg-blue-500'}`}></span>
        <span className="text-[10px] font-bold uppercase tracking-wider">
          {isActive ? 'Dinliyor...' : 'Sesli Asistan'}
        </span>
      </button>
      {isActive && (
        <div className="text-[10px] italic text-[var(--text-color-secondary)] animate-pulse max-w-[150px] truncate">
          "{transcript || "Dinleniyor..."}"
        </div>
      )}
    </div>
  );
}
