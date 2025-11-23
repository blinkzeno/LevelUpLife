// AI service for habit generation using Gemini
import { GoogleGenAI } from "@google/genai";
import * as FileSystem from "expo-file-system/legacy";

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn("⚠️ GEMINI_API_KEY not found in environment variables");
}

const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY || "" });

export interface AIHabit {
  title: string;
  description: string;
  category: "fitness" | "learning" | "productivity" | "wellness" | "creative" | "social";
  frequency: "daily" | "weekly";
  icon: string;
}

const HABIT_SYSTEM_PROMPT = `Vous êtes un expert en formation d'habitudes. Générez 3 à 5 habitudes spécifiques et réalisables basées sur l'objectif de l'utilisateur.

Pour chaque habitude, fournissez :
- "title" : Nom de l'habitude clair et concis (max 50 caractères)
- "description" : Pourquoi cette habitude est importante (max 150 caractères)
- "category" : Une des catégories ["fitness", "learning", "productivity", "wellness", "creative", "social"]
- "frequency" : "daily" ou "weekly"
- "icon" : Emoji pertinent (un seul emoji)

Produisez UNIQUEMENT un tableau JSON valide. N'incluez pas de formatage Markdown comme \`\`\`json. Juste le JSON brut.

Exemple de sortie :
[
  {
    "title": "Méditation Matinale",
    "description": "Commencez votre journée avec clarté et concentration",
    "category": "wellness",
    "frequency": "daily",
    "icon": "🧘"
  }
]
`;



/**
 * Generate habits from text prompt using Gemini
 */
export async function generateHabitsFromText(prompt: string): Promise<AIHabit[]> {
  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { text: HABIT_SYSTEM_PROMPT },
        { text: `User goal: ${prompt}` },
      ],
    });

    const text = response.text;

    // Clean the response (remove markdown code blocks if present)
    const cleanedText = text
      ? text.replace(/```json/g, "").replace(/```/g, "").trim()
      : "[]";

    const habits = JSON.parse(cleanedText);

    // Validate the response
    if (!Array.isArray(habits)) {
      throw new Error("Invalid response format");
    }

    return habits.map((habit) => ({
      title: habit.title || "Nouvelle habitude",
      description: habit.description || "",
      category: habit.category || "productivity",
      frequency: habit.frequency || "daily",
      icon: habit.icon || "🎯",
    }));
  } catch (error) {
    console.error("Error generating habits from text:", error);
    throw new Error("Impossible de générer des habitudes. Réessayez.");
  }
}

/**
 * Generate habits from audio using Gemini multimodal
 */
export async function generateHabitsFromAudio(audioUri: string): Promise<AIHabit[]> {
  try {
    // Read audio file as base64
    const base64Audio = await FileSystem.readAsStringAsync(audioUri, {
      encoding: "base64",
    });

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { text: HABIT_SYSTEM_PROMPT },
        {
          inlineData: {
            mimeType: "audio/mp4",
            data: base64Audio,
          },
        },
        { text: "Generate habits based on this audio." },
      ],
    });

    const text = response.text;
    const cleanedText = text
      ? text.replace(/```json/g, "").replace(/```/g, "").trim()
      : "[]";

    const habits = JSON.parse(cleanedText);

    if (!Array.isArray(habits)) {
      throw new Error("Invalid response format");
    }

    return habits.map((habit) => ({
      title: habit.title || "Nouvelle habitude",
      description: habit.description || "",
      category: habit.category || "productivity",
      frequency: habit.frequency || "daily",
      icon: habit.icon || "🎯",
    }));
  } catch (error) {
    console.error("Error generating habits from audio:", error);
    throw new Error("Impossible de traiter l'audio. Réessayez.");
  }
}

/**
 * Get habit suggestions by category
 */
export async function getHabitSuggestions(category: string): Promise<AIHabit[]> {
  const categoryPrompts: Record<string, string> = {
    fitness: "Suggest habits for physical fitness and exercise",
    learning: "Suggest habits for continuous learning and skill development",
    productivity: "Suggest habits for better productivity and time management",
    wellness: "Suggest habits for mental health and overall wellness",
    creative: "Suggest habits for creativity and artistic expression",
    social: "Suggest habits for better social connections and relationships",
  };

  const prompt = categoryPrompts[category] || "Suggest general good habits";
  return generateHabitsFromText(prompt);
}

/**
 * Habit templates for quick-add
 */
export const HABIT_TEMPLATES: AIHabit[] = [
  {
    title: "Morning Exercise",
    description: "Start your day with 30 minutes of physical activity",
    category: "fitness",
    frequency: "daily",
    icon: "🏃",
  },
  {
    title: "Read for 20 Minutes",
    description: "Expand your knowledge through daily reading",
    category: "learning",
    frequency: "daily",
    icon: "📚",
  },
  {
    title: "Meditation",
    description: "Practice mindfulness for mental clarity",
    category: "wellness",
    frequency: "daily",
    icon: "🧘",
  },
  {
    title: "Drink 8 Glasses of Water",
    description: "Stay hydrated throughout the day",
    category: "wellness",
    frequency: "daily",
    icon: "💧",
  },
  {
    title: "Deep Work Session",
    description: "2 hours of focused, distraction-free work",
    category: "productivity",
    frequency: "daily",
    icon: "💼",
  },
  {
    title: "Journal",
    description: "Reflect on your day and thoughts",
    category: "creative",
    frequency: "daily",
    icon: "📝",
  },
  {
    title: "Call a Friend",
    description: "Maintain social connections",
    category: "social",
    frequency: "weekly",
    icon: "📞",
  },
  {
    title: "Learn Something New",
    description: "Spend time on a course or tutorial",
    category: "learning",
    frequency: "daily",
    icon: "🎓",
  },
];
