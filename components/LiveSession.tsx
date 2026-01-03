
import React, { useEffect, useRef, useState } from 'react';
import { createLiveSession, decodeAudio, encodeAudio } from '../services/geminiService';
import { Language } from '../types';

interface LiveSessionProps {
  language: Language;
  onClose: () => void;
}

const LiveSession: React.FC<LiveSessionProps> = ({ language, onClose }) => {
  const [status, setStatus] = useState<'connecting' | 'open' | 'error'>('connecting');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionPromiseRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });

    const setupLive = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        sessionPromiseRef.current = createLiveSession(language, {
          onOpen: () => {
            setStatus('open');
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const base64 = encodeAudio(inputData);
              sessionPromiseRef.current.then((session: any) => {
                session.sendRealtimeInput({ media: { data: base64, mimeType: 'audio/pcm;rate=16000' } });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
          },
          onMessage: (msg) => console.log("Model Text:", msg),
          onAudio: async (base64) => {
            if (!audioContextRef.current) return;
            setIsSpeaking(true);
            const buffer = await decodeAudio(base64, audioContextRef.current);
            const source = audioContextRef.current.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContextRef.current.destination);
            
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += buffer.duration;
            
            sourcesRef.current.add(source);
            source.onended = () => {
              sourcesRef.current.delete(source);
              if (sourcesRef.current.size === 0) setIsSpeaking(false);
            };
          },
          onInterrupted: () => {
            sourcesRef.current.forEach(s => s.stop());
            sourcesRef.current.clear();
            nextStartTimeRef.current = 0;
            setIsSpeaking(false);
          },
          onError: (e) => {
            console.error("Live Error:", e);
            setStatus('error');
          }
        });
      } catch (err) {
        console.error("Mic Access Error:", err);
        setStatus('error');
      }
    };

    setupLive();

    return () => {
      sessionPromiseRef.current?.then((s: any) => s.close());
      audioContextRef.current?.close();
      inputAudioContext.close();
    };
  }, [language]);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col items-center p-8 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors active:scale-90"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>

        <div className="mb-6 relative">
          <div className={`w-32 h-32 rounded-full flex items-center justify-center text-4xl bg-teal-100 text-teal-600 transition-transform duration-500 ${isSpeaking ? 'scale-110' : ''}`}>
            👩‍🏫
          </div>
          {isSpeaking && (
            <div className="absolute -inset-2 rounded-full border-4 border-teal-500 border-t-transparent animate-spin"></div>
          )}
        </div>

        <h2 className="text-xl font-bold text-slate-800 mb-2">
          {language === 'ar' ? 'جلسة تواصل مباشر' : 'On Air Live Session'}
        </h2>
        
        <p className="text-slate-500 text-center mb-8 px-4">
          {status === 'connecting' && (language === 'ar' ? 'جاري الاتصال...' : 'Connecting...')}
          {status === 'open' && (language === 'ar' ? 'المعلمة تستمع إليك، تفضل بطرح سؤالك' : 'The teacher is listening, please ask your question')}
          {status === 'error' && (language === 'ar' ? 'حدث خطأ في الاتصال' : 'Connection error')}
        </p>

        <div className="flex gap-4 w-full">
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
             {isSpeaking && <div className="h-full bg-teal-500 w-full animate-[pulse_1s_infinite]"></div>}
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-8 w-full py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-red-200"
        >
          {language === 'ar' ? 'إنهاء الجلسة' : 'End Session'}
        </button>
      </div>
    </div>
  );
};

export default LiveSession;
