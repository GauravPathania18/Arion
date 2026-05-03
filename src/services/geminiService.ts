import { GoogleGenAI } from "@google/genai";
import { DayData, BehavioralMetrics, FocusSession, SiteUsage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateSessionSummary(session: FocusSession, siteUsage: SiteUsage[], metrics: BehavioralMetrics) {
  const prompt = `
    Analyze this finished Focus Session:
    
    SESSION DETAILS:
    - Target Duration: ${session.duration} minutes
    - Completion Status: ${session.completed ? 'SUCCESSFUL' : 'ABANDONED'}
    - Distractions Blocked: ${session.distractionsBlocked}
    
    BEHAVIORAL DATA DURING SESSION:
    - Sites Visited: ${siteUsage.map(s => `${s.domain} (${Math.round(s.timeSpent / 60)}m)`).join(', ')}
    - Tab Switch Rate: ${metrics.tabSwitchFrequency} switches/min
    - Dopamine Loop Risk: ${metrics.dopamineLoopDetected ? 'HIGH' : 'LOW'}
    
    TASK:
    1. SUMMARY: Provide a 1-sentence punchy summary of their performance.
    2. BEHAVIORAL OBSERVATION: Note one specific positive or negative behavior pattern observed.
    3. IMPROVEMENT: Suggest one tiny adjustment for the next session.
    
    Tone: Sophisticated, clinical, high-performance coaching style. Use Markdown.
    Be concise (max 100 words).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("AI Session Summary Error:", error);
    return "Session completed. Great work staying focused.";
  }
}

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
