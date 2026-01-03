
import { GoogleGenAI, GenerateContentResponse, Modality, LiveServerMessage } from "@google/genai";
import { Language } from "../types";

const API_KEY = process.env.API_KEY || "";

export const explainLesson = async (
  language: Language, 
  unitTitle: string, 
  topicTitle: string, 
  part: number
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const prompt = `
    أنتِ معلمة كيمياء محترفة لطلاب الصف الثاني الثانوي.
    اللغة: ${language === 'ar' ? 'العربية' : 'الإنجليزية'}.
    المنهج: المنهج المصري الرسمي.
    الوحدة: ${unitTitle}
    الموضوع: ${topicTitle}
    التعليمات: هذا هو الجزء رقم ${part} من أصل 4 أجزاء.
    
    قواعد صارمة للمحتوى:
    1. استخدمي فقط الرموز العلمية الكيميائية المتعارف عليها في الكتاب المدرسي (مثل H2O, NaCl, mol).
    2. ممنوع تماماً استخدام النجوم (*) أو علامات المربعات (#) أو علامات الدولار ($) أو أي رموز تنسيق ماركداون تظهر في النص.
    3. لا تستخدمي رموزاً تشتت الطالب؛ اجعلي النص نقياً وواضحاً كأنه مأخوذ من صفحات الكتاب.
    4. اشرحي الأمثلة المحلولة خطوة بخطوة وببساطة.
    5. التزمي بالوقار العلمي والهدوء في الصياغة.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "عذراً، لم أتمكن من توليد الشرح.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "خطأ في الاتصال بالمعلمة.";
  }
};

export const generateDiagramContent = async (
  language: Language,
  topicTitle: string
): Promise<{ imageUrl: string; explanation: string }> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  // 1. Generate the Image
  const imagePrompt = `A clear, educational scientific diagram for a 2nd secondary chemistry student about the topic: "${topicTitle}". The diagram should be professional, clean, and focus on the chemical structures, atomic models, or lab setups relevant to this topic. Use white background and clear labels.`;
  
  const imageResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: imagePrompt }] },
    config: { imageConfig: { aspectRatio: "16:9" } }
  });

  let imageUrl = "";
  for (const part of imageResponse.candidates[0].content.parts) {
    if (part.inlineData) {
      imageUrl = `data:image/png;base64,${part.inlineData.data}`;
      break;
    }
  }

  // 2. Generate the Explanation for the diagram
  const explanationPrompt = `
    بصفتك معلمة كيمياء، قومي بالتعليق على الرسم التوضيحي الذي يخص موضوع: ${topicTitle}.
    اللغة: ${language === 'ar' ? 'العربية' : 'الإنجليزية'}.
    اشرحي للطالب ما يراه في الرسم وكيف يرتبط هذا بالمفاهيم العلمية المقررة عليه بأسلوب هادئ ومشجع.
    تجنبي الرموز المشتتة (النجوم، المربعات، إلخ).
  `;

  const textResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: explanationPrompt,
  });

  return {
    imageUrl,
    explanation: textResponse.text || ""
  };
};

export const generateTest = async (
  language: Language,
  unitTitle: string,
  topicTitle: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const prompt = `
    بصفتك معلمة كيمياء، قومي بإنشاء اختبار شامل ومتنوع لطلاب الصف الثاني الثانوي حول موضوع: ${topicTitle} في وحدة: ${unitTitle}.
    اللغة: ${language === 'ar' ? 'العربية' : 'الإنجليزية'}.
    
    يجب أن يشمل الاختبار:
    1. أسئلة اختيار من متعدد.
    2. أسئلة "صح أو خطأ" مع التعليل.
    3. أسئلة تفسيرية (علل).
    4. أسئلة تفكير ناقد.
    
    شروط هامة:
    - استخدمي الرموز الكيميائية الصحيحة فقط.
    - لا تستخدمي أي رموز مشتتة مثل النجوم (*) أو علامات الدولار ($).
    - اجعلي لغة الاختبار مشجعة وهادئة.
    - لا تضعي الإجابات في البداية، اطلبي من الطالب التفكير.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    return response.text || "عذراً، لم أتمكن من إنشاء الاختبار.";
  } catch (error) {
    console.error("Test Generation Error:", error);
    return "حدث خطأ أثناء محاولة إنشاء الاختبار.";
  }
};

export const generateSpeech = async (text: string, language: Language): Promise<string | undefined> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const instruction = language === 'ar' 
    ? `تحدثي بصوت أنثوي، بهدوء شديد وببطء ووقار كمعلمة تشرح في الفصل، مع إعطاء فواصل قصيرة بين الجمل: ${text}`
    : `Speak in a calm, female voice, slowly and professionally like a teacher in a classroom, with short pauses between sentences: ${text}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: instruction }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    console.error("TTS Error:", error);
    return undefined;
  }
};

export const createLiveSession = async (
  language: Language,
  callbacks: {
    onOpen: () => void;
    onMessage: (message: string) => void;
    onAudio: (data: string) => void;
    onInterrupted: () => void;
    onError: (e: any) => void;
  }
) => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const systemInstruction = `
    أنتِ معلمة كيمياء صبورة وهادئة جداً. 
    تحدثي ببطء ووضوح تام في هذه الجلسة المباشرة. 
    اللغة: ${language === 'ar' ? 'العربية' : 'الإنجليزية'}.
    التزمي بالرموز العلمية الصحيحة فقط وتجنبي الحشو أو الرموز المشتتة.
  `;

  return ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
      },
      systemInstruction,
    },
    callbacks: {
      onopen: callbacks.onOpen,
      onmessage: async (message: LiveServerMessage) => {
        if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
          callbacks.onAudio(message.serverContent.modelTurn.parts[0].inlineData.data);
        }
        if (message.serverContent?.interrupted) {
          callbacks.onInterrupted();
        }
      },
      onerror: callbacks.onError,
      onclose: () => console.log("Live session closed"),
    },
  });
};

export const decodeAudio = async (base64: string, ctx: AudioContext): Promise<AudioBuffer> => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const dataInt16 = new Int16Array(bytes.buffer);
  const frameCount = dataInt16.length;
  const buffer = ctx.createBuffer(1, frameCount, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
};

export const encodeAudio = (data: Float32Array): string => {
  const int16 = new Int16Array(data.length);
  for (let i = 0; i < data.length; i++) {
    int16[i] = data[i] * 32768;
  }
  const bytes = new Uint8Array(int16.buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};
