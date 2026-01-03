
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import LiveSession from './components/LiveSession';
import { Language, Unit, Topic } from './types';
import { explainLesson, generateSpeech, decodeAudio, generateTest, generateDiagramContent } from './services/geminiService';

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('ar');
  const [selectedTopic, setSelectedTopic] = useState<{ unit: Unit; topic: Topic } | null>(null);
  const [currentPart, setCurrentPart] = useState(1);
  const [explanation, setExplanation] = useState<string>("");
  const [testContent, setTestContent] = useState<string>("");
  const [diagramData, setDiagramData] = useState<{ imageUrl: string; explanation: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showLive, setShowLive] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [viewMode, setViewMode] = useState<'explanation' | 'test' | 'diagram'>('explanation');

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  
  const lastAudioRequestId = useRef(0);

  const stopSpeaking = () => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (e) { }
      audioSourceRef.current = null;
    }
    setIsSpeaking(false);
  };

  const playSpeech = async (text: string) => {
    stopSpeaking();
    
    const requestId = ++lastAudioRequestId.current;
    setIsSpeaking(true);
    
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }

    const cleanText = text.replace(/[*_#$`~]/g, '').trim();
    const audioData = await generateSpeech(cleanText, language);
    
    if (requestId !== lastAudioRequestId.current) return;

    if (audioData && audioContextRef.current) {
      const buffer = await decodeAudio(audioData, audioContextRef.current);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      audioSourceRef.current = source;
      
      source.onended = () => {
        if (requestId === lastAudioRequestId.current) {
          setIsSpeaking(false);
        }
      };
      
      source.start();
    } else {
      setIsSpeaking(false);
    }
  };

  const handleTopicSelect = (unit: Unit, topic: Topic) => {
    stopSpeaking();
    lastAudioRequestId.current++;
    setSelectedTopic({ unit, topic });
    setCurrentPart(1);
    setHasStarted(false);
    setExplanation("");
    setTestContent("");
    setDiagramData(null);
    setViewMode('explanation');
  };

  const loadExplanation = useCallback(async (partOverride?: number) => {
    if (!selectedTopic) return;
    
    stopSpeaking();
    lastAudioRequestId.current++; 
    
    setIsLoading(true);
    setViewMode('explanation');
    const targetPart = partOverride || currentPart;
    
    const content = await explainLesson(
      language, 
      language === 'ar' ? selectedTopic.unit.titleAr : selectedTopic.unit.titleEn,
      language === 'ar' ? selectedTopic.topic.titleAr : selectedTopic.topic.titleEn,
      targetPart
    );
    
    setExplanation(content);
    setIsLoading(false);
    
    playSpeech(content);
  }, [selectedTopic, currentPart, language]);

  const handleNextPartRequest = () => {
    if (currentPart < 4) {
      setCurrentPart(prev => prev + 1);
    }
  };

  const handleRequestDiagram = async () => {
    if (!selectedTopic) return;
    stopSpeaking();
    lastAudioRequestId.current++;
    setIsLoading(true);
    setViewMode('diagram');

    const data = await generateDiagramContent(
      language,
      language === 'ar' ? selectedTopic.topic.titleAr : selectedTopic.topic.titleEn
    );

    setDiagramData(data);
    setIsLoading(false);
    playSpeech(data.explanation);
  };

  const handleRequestTest = async () => {
    if (!selectedTopic) return;
    stopSpeaking();
    lastAudioRequestId.current++;
    setIsLoading(true);
    setViewMode('test');
    
    const test = await generateTest(
      language,
      language === 'ar' ? selectedTopic.unit.titleAr : selectedTopic.unit.titleEn,
      language === 'ar' ? selectedTopic.topic.titleAr : selectedTopic.topic.titleEn
    );
    
    setTestContent(test);
    setIsLoading(false);
    
    const introMsg = language === 'ar' 
      ? "رائع! إليك الاختبار الشامل. خذ وقتك في التفكير والإجابة بهدوء." 
      : "Great! Here is the comprehensive test. Take your time to think and answer calmly.";
    playSpeech(introMsg + " " + test);
  };

  useEffect(() => {
    if (selectedTopic && hasStarted && viewMode === 'explanation') {
      loadExplanation();
    }
    return () => stopSpeaking();
  }, [currentPart, hasStarted, selectedTopic, loadExplanation, viewMode]);

  return (
    <div className={`min-h-screen flex flex-col bg-slate-50 ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Header 
        language={language} 
        setLanguage={setLanguage} 
        onOpenLive={() => setShowLive(true)} 
        isLive={showLive}
      />
      
      <div className="flex flex-col md:flex-row flex-1">
        <Sidebar 
          language={language} 
          onSelectTopic={handleTopicSelect} 
          selectedTopicId={selectedTopic?.topic.id}
        />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-[calc(100vh-64px)]">
          {!selectedTopic ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-6">
              <div className="text-6xl">👩‍🏫</div>
              <h2 className="text-3xl font-bold text-slate-800">
                {language === 'ar' ? 'معلمة الكيمياء الافتراضية' : 'Your AI Chemistry Teacher'}
              </h2>
              <p className="text-slate-600 text-lg">
                {language === 'ar' 
                  ? 'من فضلك اختر درساً من القائمة لبدء الشرح الهادئ والوافي للمنهج.' 
                  : 'Please select a topic to begin a calm and detailed explanation of the curriculum.'}
              </p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              {!hasStarted ? (
                <div className="bg-white rounded-3xl shadow-xl border border-teal-100 p-10 text-center space-y-6 animate-in fade-in zoom-in duration-500">
                  <div className="w-20 h-20 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-4xl mx-auto">🧪</div>
                  <h3 className="text-2xl font-bold text-slate-800">
                    {language === 'ar' ? `بدء درس: ${selectedTopic.topic.titleAr}` : `Start: ${selectedTopic.topic.titleEn}`}
                  </h3>
                  <button 
                    onClick={() => setHasStarted(true)}
                    className="bg-teal-600 text-white px-10 py-4 rounded-2xl font-bold text-xl hover:bg-teal-700 active:scale-95 active:bg-teal-800 transition-all shadow-lg shadow-teal-200"
                  >
                    {language === 'ar' ? 'ابدئي شرح الجزء الأول' : 'Start explaining Part 1'}
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-teal-600 px-6 py-4 flex items-center justify-between text-white">
                    <div className="flex items-center gap-4">
                      {isSpeaking && (
                        <div className="flex gap-1 items-end h-4">
                          <div className="w-1 bg-white/60 animate-[pulse_0.8s_infinite] h-2"></div>
                          <div className="w-1 bg-white animate-[pulse_1s_infinite] h-4"></div>
                          <div className="w-1 bg-white/60 animate-[pulse_1.2s_infinite] h-3"></div>
                        </div>
                      )}
                      <div>
                        <div className="text-xs opacity-80 uppercase tracking-widest font-bold">
                          {language === 'ar' ? selectedTopic.unit.titleAr : selectedTopic.unit.titleEn}
                        </div>
                        <h2 className="text-xl font-bold">
                          {viewMode === 'test' && (language === 'ar' ? 'اختبار شامل: ' : 'Comprehensive Test: ')}
                          {viewMode === 'diagram' && (language === 'ar' ? 'رسم توضيحي: ' : 'Diagram Explanation: ')}
                          {language === 'ar' ? selectedTopic.topic.titleAr : selectedTopic.topic.titleEn}
                        </h2>
                      </div>
                    </div>
                    {viewMode === 'explanation' && (
                      <div className="bg-teal-700/50 px-4 py-1.5 rounded-full text-sm font-bold border border-teal-500/30">
                        {language === 'ar' ? `الجزء ${currentPart} / 4` : `Part ${currentPart} / 4`}
                      </div>
                    )}
                  </div>

                  <div className="p-6 md:p-10 min-h-[400px]">
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center h-full py-20 space-y-6">
                        <div className="w-16 h-16 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin"></div>
                        <p className="text-teal-700 font-bold text-lg animate-pulse">
                          {viewMode === 'test' ? (language === 'ar' ? 'جاري إعداد الاختبار...' : 'Preparing the test...') : 
                           viewMode === 'diagram' ? (language === 'ar' ? 'جاري تجهيز الرسم والشرح...' : 'Preparing diagram and explanation...') :
                           (language === 'ar' ? 'المعلمة تحضر المحتوى...' : 'Preparing content...')}
                        </p>
                      </div>
                    ) : (
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex justify-end mb-4">
                           <button 
                            onClick={() => isSpeaking ? stopSpeaking() : playSpeech(viewMode === 'test' ? testContent : viewMode === 'diagram' ? diagramData?.explanation || "" : explanation)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all active:scale-95 ${isSpeaking ? 'bg-red-50 text-red-600 border border-red-100 active:bg-red-100' : 'bg-teal-50 text-teal-600 border border-teal-100 hover:bg-teal-100 active:bg-teal-200'}`}
                           >
                             <span>{isSpeaking ? '⏹️' : '🔊'}</span>
                             {isSpeaking 
                               ? (language === 'ar' ? 'إيقاف الصوت' : 'Stop Speaking') 
                               : (language === 'ar' ? 'إعادة استماع' : 'Listen')}
                           </button>
                        </div>

                        {viewMode === 'diagram' && diagramData && (
                          <div className="mb-8 space-y-6">
                            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50">
                              <img src={diagramData.imageUrl} alt="Chemistry Diagram" className="w-full h-auto object-contain max-h-[500px]" />
                            </div>
                            <div className="prose prose-teal max-w-none whitespace-pre-wrap leading-relaxed text-slate-700 text-lg selection:bg-teal-100">
                              {diagramData.explanation}
                            </div>
                          </div>
                        )}

                        {viewMode !== 'diagram' && (
                          <div className="prose prose-teal max-w-none whitespace-pre-wrap leading-relaxed text-slate-700 text-lg mb-10 selection:bg-teal-100">
                            {viewMode === 'test' ? testContent : explanation}
                          </div>
                        )}

                        <div className="mt-12 border-t border-slate-100 pt-8">
                          <h4 className="font-bold text-slate-800 mb-4">
                            {language === 'ar' ? 'ماذا تريد مني الآن يا معلمتي؟' : 'What next, teacher?'}
                          </h4>
                          <div className="flex flex-wrap gap-3">
                            {viewMode === 'explanation' ? (
                              <>
                                {currentPart < 4 ? (
                                  <button 
                                    onClick={handleNextPartRequest}
                                    className="bg-teal-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-teal-700 active:scale-95 active:bg-teal-800 transition-all flex items-center gap-2 shadow-md"
                                  >
                                    {language === 'ar' ? `انتقلي لشرح الجزء ${currentPart + 1}` : `Move to Part ${currentPart + 1}`}
                                    <span className={language === 'ar' ? 'rotate-180' : ''}>➜</span>
                                  </button>
                                ) : (
                                  <button 
                                    onClick={handleRequestTest}
                                    className="bg-amber-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-amber-600 active:scale-95 active:bg-amber-700 transition-all shadow-md flex items-center gap-2"
                                  >
                                    <span>📝</span>
                                    {language === 'ar' ? 'أريد اختباراً شاملاً على الدرس' : 'I want a comprehensive test'}
                                  </button>
                                )}
                                
                                <button 
                                  onClick={handleRequestDiagram}
                                  className="bg-sky-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-sky-700 active:scale-95 active:bg-sky-800 transition-all shadow-md flex items-center gap-2"
                                >
                                  <span>🖼️</span>
                                  {language === 'ar' ? 'وضحي بالرسم' : 'Explain with Diagram'}
                                </button>

                                <button 
                                  onClick={() => loadExplanation()}
                                  className="bg-white border-2 border-slate-200 text-slate-600 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 active:scale-95 active:bg-slate-100 transition-all"
                                >
                                  {language === 'ar' ? 'أعيدي شرح هذا الجزء بتبسيط أكثر' : 'Explain more simply'}
                                </button>
                              </>
                            ) : (
                              <button 
                                onClick={() => {
                                  stopSpeaking();
                                  setViewMode('explanation');
                                }}
                                className="bg-teal-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-teal-700 active:scale-95 transition-all shadow-md"
                              >
                                {language === 'ar' ? 'العودة إلى شرح الدرس' : 'Back to lesson explanation'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {viewMode === 'explanation' && (
                    <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => {
                          stopSpeaking();
                          setCurrentPart(prev => prev - 1);
                        }}
                        disabled={currentPart === 1 || isLoading}
                        className="text-sm font-bold text-slate-400 hover:text-slate-600 disabled:opacity-0 transition-all active:scale-95"
                      >
                        {language === 'ar' ? '← العودة للخلف' : '← Go back'}
                      </button>
                      <div className="flex gap-3">
                        {[1, 2, 3, 4].map(p => (
                          <div 
                            key={p} 
                            className={`h-2 rounded-full transition-all duration-500 ${
                              currentPart === p ? 'bg-teal-600 w-12' : (p < currentPart ? 'bg-teal-300 w-4' : 'bg-slate-200 w-4')
                            }`}
                          />
                        ))}
                      </div>
                      <div className="w-20"></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {showLive && (
        <LiveSession 
          language={language} 
          onClose={() => setShowLive(false)} 
        />
      )}
    </div>
  );
};

export default App;
