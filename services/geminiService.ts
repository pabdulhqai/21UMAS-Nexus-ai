import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async fetchLatestNews() {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: "استخرج آخر 4 أخبار أو إعلانات رسمية هامة من موقع جامعة 21 سبتمبر (https://21umas.edu.ye/). ركز على الأخبار الحديثة جداً (2024/2025). نسق الرد كنقاط موجزة.",
        config: {
          tools: [{ googleSearch: {} }],
          systemInstruction: "أنت مراسل صحفي لجامعة 21 سبتمبر. مهمتك جلب الأخبار بدقة من الموقع الرسمي فقط."
        },
      });

      return {
        text: response.text || "عذراً، لم أتمكن من الوصول لآخر الأخبار حالياً.",
        sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
      };
    } catch (error) {
      console.error("News Fetch Error:", error);
      return { text: "تعذر الاتصال بخادم الأخبار. يرجى المحاولة لاحقاً.", sources: [] };
    }
  }

  async chatPro(prompt: string, history: any[] = [], isAdvisor: boolean = false) {
    try {
      const contextInstruction = isAdvisor 
        ? SYSTEM_INSTRUCTION + "\n\n ركز بشكل خاص على: شروط القبول، المعدلات، التكاليف الدراسية، والخطط الدراسية. تصرف كمرشد أكاديمي خبير."
        : SYSTEM_INSTRUCTION;

      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          ...history,
          { role: 'user', parts: [{ text: prompt }] }
        ],
        config: {
          systemInstruction: contextInstruction,
          tools: [{ googleSearch: {} }],
          thinkingConfig: { thinkingBudget: 32768 } // Enable deep reasoning
        },
      });

      return {
        text: response.text || "عذراً، لم أستطع تكوين إجابة. يرجى إعادة الصياغة.",
        sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
          title: chunk.web?.title || "مصدر أكاديمي",
          uri: chunk.web?.uri || ""
        })) || []
      };
    } catch (error) {
      console.error("Chat Error:", error);
      return { text: "حدث خطأ غير متوقع في النظام. يرجى التحقق من الاتصال.", sources: [] };
    }
  }

  async analyzeVision(imageBuffer: string, prompt: string) {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: imageBuffer, mimeType: 'image/jpeg' } },
            { text: `بصفتك خبيراً أكاديمياً وطبياً في جامعة 21 سبتمبر: ${prompt}` }
          ]
        },
      });
      return response.text || "فشل تحليل الصورة.";
    } catch (error) {
      console.error("Vision Error:", error);
      return "حدث خطأ أثناء معالجة الصورة. تأكد من أن الصورة واضحة.";
    }
  }
}

export const geminiService = new GeminiService();
