import { GoogleGenAI, Type } from "@google/genai";
import { EvaluationStatus, AnalysisResult, TechniqueAnalysis } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `
Bạn là một chuyên gia phân tích kỹ thuật thể thao (AI Sports Coach).
Nhiệm vụ: Phân tích kỹ thuật NÉM BÓNG của học sinh qua video/hình ảnh.

TIÊU CHUẨN KỸ THUẬT:
Giai đoạn 1: Tư thế chuẩn bị:
– Chân: Đứng chân trước chân sau, rộng bằng vai. Chân không thuận phía trước.
– Thân: Trọng tâm dồn đều.
– Tay: Cầm bóng trước ngực. Mắt nhìn hướng ném.

Giai đoạn 2: Thực hiện động tác ném bóng:
– Xoay thân, đưa bóng lên vai (tay thuận cầm bóng, tay kia hướng ném).
– Xoay hông, ném bóng, bước chân sau lên giữ thăng bằng.

YÊU CẦU ĐẦU RA (JSON):
Trả về JSON object theo schema. 
QUAN TRỌNG: Với mỗi điểm đúng hoặc lỗi sai, NẾU là video, hãy cung cấp "timestamp" (thời gian xảy ra trong video, định dạng MM:SS, ví dụ "00:04"). Nếu là hình ảnh, để timestamp là "00:00".

1. "summaryQuote": NHẬN XÉT CHI TIẾT VỀ TOÀN BỘ QUÁ TRÌNH THỰC HIỆN. Hãy mô tả khái quát học sinh đã thực hiện chuỗi động tác như thế nào (ví dụ: tư thế khởi đầu ra sao, sự phối hợp giữa tay và chân, nhịp điệu động tác nhanh hay chậm, có dứt khoát không).
2. "phases": Mảng 2 giai đoạn.
   - "phaseName": Tên giai đoạn (Sử dụng chính xác: "Giai đoạn 1: Tư thế chuẩn bị" và "Giai đoạn 2: Thực hiện động tác ném bóng").
   - "score": Điểm (0-10).
   - "assessment": Nhận xét chi tiết cho giai đoạn này.
   - "correctPoints": Mảng các điểm thực hiện ĐÚNG. { "description": "...", "timestamp": "MM:SS" }
   - "errors": Mảng các LỖI SAI. { "description": "...", "timestamp": "MM:SS" }
   - "improvement": Lời khuyên sửa lỗi cụ thể cho giai đoạn này.
3. "overallAdvice": Lời khuyên tổng kết ngắn gọn để cải thiện trong tương lai.
4. "evaluation": "Hoàn thành tốt" | "Hoàn thành" | "Chưa hoàn thành".
`;

export const analyzeTechnique = async (
  mediaBase64: string,
  mimeType: string
): Promise<AnalysisResult> => {
  try {
    const modelId = 'gemini-3.1-pro-preview';
    const finalMimeType = mimeType || 'video/mp4';

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          { text: SYSTEM_PROMPT },
          { inlineData: { data: mediaBase64, mimeType: finalMimeType } },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summaryQuote: { type: Type.STRING },
            phases: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  phaseName: { type: Type.STRING },
                  score: { type: Type.NUMBER },
                  assessment: { type: Type.STRING },
                  correctPoints: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        description: { type: Type.STRING },
                        timestamp: { type: Type.STRING }
                      },
                      required: ["description", "timestamp"]
                    }
                  },
                  errors: { 
                    type: Type.ARRAY, 
                    items: { 
                      type: Type.OBJECT,
                      properties: {
                        description: { type: Type.STRING },
                        timestamp: { type: Type.STRING }
                      },
                      required: ["description", "timestamp"]
                    } 
                  },
                  improvement: { type: Type.STRING }
                },
                required: ["phaseName", "score", "assessment", "correctPoints", "errors", "improvement"]
              }
            },
            overallAdvice: { type: Type.STRING },
            evaluation: { 
              type: Type.STRING, 
              description: "Must be one of: 'Hoàn thành tốt', 'Hoàn thành', 'Chưa hoàn thành'"
            }
          },
          required: ["summaryQuote", "phases", "overallAdvice", "evaluation"]
        }
      },
    });

    let jsonText = response.text || "{}";
    jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    const data = JSON.parse(jsonText) as TechniqueAnalysis;
    
    return {
      data: data,
      rawText: jsonText
    };

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Không thể phân tích dữ liệu. Vui lòng thử lại.");
  }
};