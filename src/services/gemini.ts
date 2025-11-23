import { GoogleGenAI } from "@google/genai";
import * as FileSystem from 'expo-file-system/legacy';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

if (!API_KEY) {
  console.warn("Missing EXPO_PUBLIC_GEMINI_API_KEY in .env.local");
}

const ia = new GoogleGenAI({ apiKey: API_KEY });

const SYSTEM_PROMPT = `
You are a helpful assistant that generates daily schedules.
Output ONLY a valid JSON array of objects.
Each object should have:
- "title": string (short task name)
- "startTime": string (HH:MM format, 24h)
- "endTime": string (HH:MM format, 24h)
- "description": string (optional details)
- "type": "work" | "health" | "learning" | "social" | "other"

Example output:
[
  { "title": "Morning Jog", "startTime": "07:00", "endTime": "07:30", "type": "health" },
  { "title": "Deep Work", "startTime": "09:00", "endTime": "11:00", "type": "work" }
]
Do not include markdown formatting like \`\`\`json. Just the raw JSON.
`;

export const generateScheduleFromText = async (prompt: string) => {
  try {
    const response = await ia.models.generateContent({
      model: "gemini-2.5-flash", // Using 2.0 as 2.5 might not be fully available/stable yet, or user meant 2.0. 
      // Wait, user said "gemini-2.5-flash". I should check if that exists. 
      // Actually, let's stick to what user asked "gemini-2.5-flash" but usually it's 1.5 or 2.0.
      // Let's use "gemini-2.0-flash" as it is the latest stable. 
      // User wrote "gemini-2.5-flash" in the request. I will use what they asked but fallback if needed.
      // Actually, standard is 1.5-flash or 2.0-flash-exp. I'll use "gemini-2.0-flash-exp" or just what they said.
      // Let's use "gemini-2.0-flash" as a safe bet for "new".
      // User explicitly wrote "gemini-2.5-flash". I will use it.
     
      contents: [
        { text: SYSTEM_PROMPT },
        { text: `User request: ${prompt}` },
      ],
    });

    const text = response.text;
    
    // Clean up potential markdown
    const cleanText = text ? text.replace(/```json/g, '').replace(/```/g, '').trim() : '[]';
    
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Gemini Text Error:", error);
    throw error;
  }
};

export const generateScheduleFromAudio = async (audioUri: string) => {
  try {
    // Read audio file as base64
    const base64Audio = await FileSystem.readAsStringAsync(audioUri, {
      encoding: 'base64',
    });

    const response = await ia.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { text: SYSTEM_PROMPT },
        {
          inlineData: {
            mimeType: "audio/mp4", // Adjust if recording format differs
            data: base64Audio,
          },
        },
        { text: "Generate a schedule based on this audio." },
      ],
    });

    const text = response.text;
    const cleanText = text ? text.replace(/```json/g, '').replace(/```/g, '').trim() : '[]';
    
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Gemini Audio Error:", error);
    throw error;
  }
};
