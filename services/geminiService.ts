import { GoogleGenAI } from "@google/genai";
import { AiActionType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-2.5-flash';

export const generateAiSuggestion = async (
  currentText: string,
  action: AiActionType,
  context?: string
): Promise<string> => {
  if (!process.env.API_KEY) {
    console.warn("API Key not found");
    return "API Key missing. Cannot generate text.";
  }

  let prompt = "";

  switch (action) {
    case AiActionType.REWRITE_FRIENDLY:
      prompt = `Rewrite the following email text to be more friendly, warm, and engaging, while keeping the core message intact: "${currentText}"`;
      break;
    case AiActionType.REWRITE_PROFESSIONAL:
      prompt = `Rewrite the following email text to be strictly professional, concise, and business-like: "${currentText}"`;
      break;
    case AiActionType.SHORTEN:
      prompt = `Shorten the following text significantly for better readability in an email, without losing key info: "${currentText}"`;
      break;
    case AiActionType.FIX_GRAMMAR:
      prompt = `Fix any grammar or spelling errors in this text. Do not change the tone: "${currentText}"`;
      break;
    case AiActionType.GENERATE_ALT:
      prompt = `Generate a concise and descriptive alt text for an image in an email context. Context: "${context || 'General email image'}". Current src/context: "${currentText}". Only return the alt text string.`;
      break;
    default:
      prompt = `Improve this text: "${currentText}"`;
  }

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text?.trim() || currentText;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return currentText; // Fallback to original
  }
};
