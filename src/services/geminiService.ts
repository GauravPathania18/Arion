import { GoogleGenAI } from "@google/genai";
import { DayData, BehavioralMetrics } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateProductivityInsights(data: DayData[], metrics: BehavioralMetrics) {
  const prompt = `
    As an expert Behavioral Neuroscientist and Productivity Architect, analyze this user's digital patterns:
    
    HISTORICAL TRENDS (Last 7 Days):
    ${JSON.stringify(data.slice(-7))}
    
    REAL-TIME BEHAVIORAL METRICS:
    - Tab Switch Frequency: ${metrics.tabSwitchFrequency} switches/min
    - Dopamine Loop Detected: ${metrics.dopamineLoopDetected ? 'YES' : 'NO'}
    - Procrastination Index: ${metrics.procrastinationScore}/100
    
    TASK:
    1. DIAGNOSE: Identify specific dopamine-seeking behaviors (e.g., rapid context switching, impulsive browsing). Explain the "Why" behind the loop.
    2. SCORE ANALYSIS: Critique their Focus Score trend with brutal honesty.
    3. INTERVENTION: Provide 3 personalized "Pattern Interrupters" (e.g., physical movement, site blocking shifts).
    4. ADAPTIVE DISCIPLINE: Suggest if they should stay in current Digital Discipline level or tighten restrictions.
    
    Tone: Sophisticated, architectural, clinical but encouraging. 
    Use Markdown. Keep it concise but dense with value.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("AI Insight Error:", error);
    return "Failed to generate AI insights. Please check your connection.";
  }
}
