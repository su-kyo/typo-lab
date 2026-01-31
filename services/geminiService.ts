
import { GoogleGenAI } from "@google/genai";
import { Tone } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Circuit breaker state to prevent spamming the API when rate limited
let quarantineUntil = 0;

/**
 * Analyzes the tone of the input text using Gemini.
 * Returns one of the predefined tones.
 */
export const detectTone = async (text: string): Promise<Tone> => {
  const now = Date.now();

  if (!text.trim() || text.length < 5) return 'serious';

  // If we are in the cooldown period after a 429 error, use heuristic immediately
  if (now < quarantineUntil) {
    return heuristicToneDetection(text);
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the tone of the following text and return exactly one word from this list: 'calm', 'playful', 'serious', 'intense'.
      
      Text: "${text}"`,
      config: {
        temperature: 0.1,
      },
    });

    const result = response.text?.toLowerCase().trim();

    if (result && ['calm', 'playful', 'serious', 'intense'].includes(result)) {
      return result as Tone;
    }

    return 'serious';
  } catch (error: any) {
    // Check if error is a rate limit error (429)
    const errorString = JSON.stringify(error);
    if (errorString.includes("429") || errorString.includes("RESOURCE_EXHAUSTED")) {
      console.warn("Gemini API Rate Limited. Switching to local heuristic mode for 60s.");
      quarantineUntil = Date.now() + 60000; // 60 second cooldown
    } else {
      console.error("Tone detection failed:", error);
    }

    return heuristicToneDetection(text);
  }
};

/**
 * Fallback heuristic detection if API fails, is rate-limited, or for immediate feedback.
 */
const heuristicToneDetection = (text: string): Tone => {
  const upperCount = (text.match(/[A-Z]/g) || []).length;
  const puncCount = (text.match(/[!?]/g) || []).length;
  const lowerText = text.toLowerCase();
  const wordCount = text.split(/\s+/).length;

  // Intense: High caps, many exclamation/question marks, or very short aggressive words
  if ((upperCount > text.length * 0.4 && text.length > 3) || puncCount > 2) return 'intense';

  // Playful: Emoticons, casual language, or specific words
  if (lowerText.includes('happy') || lowerText.includes('lol') || lowerText.includes('!') || lowerText.includes('wow') || lowerText.includes(':)')) return 'playful';

  // Calm: Long sentences with gentle punctuation and lowercase flow
  if (wordCount > 15 && puncCount === 0) return 'calm';
  if (lowerText.includes('peace') || lowerText.includes('soft') || lowerText.includes('quiet')) return 'calm';

  return 'serious';
};
