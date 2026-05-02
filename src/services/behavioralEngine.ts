import { SiteUsage, FocusSession, BehavioralMetrics } from '../types';

export interface TabEngagement {
  domain: string;
  timestamp: number;
  duration: number; // in seconds
}

export interface DisciplineState {
  level: 'Bronze' | 'Silver' | 'Gold' | 'Iron';
  progressionPoints: number;
  consecutiveSuccesses: number;
  consecutiveBreaks: number;
  isAutoTightened: boolean;
  strictness: number; // 0 to 1
}

/**
 * Refined Dopamine Loop Detection
 * Penalizes rapid switching between different high-stimulation domains.
 */
export function detectDopamineLoops(engagements: TabEngagement[]): { 
  detected: boolean; 
  severity: number; 
  reason?: string 
} {
  if (engagements.length < 5) return { detected: false, severity: 0 };

  // Sort by timestamp descending to get most recent first
  const sorted = [...engagements].sort((a, b) => b.timestamp - a.timestamp);
  
  // Look at the last 10 engagements (last few minutes of behavior)
  const window = sorted.slice(0, 10);
  
  // Definition: A loop is a sequence of short stays (< 30s) across multiple unique domains
  const shortStays = window.filter(e => e.duration < 30);
  const uniqueDomains = new Set(window.map(e => e.domain)).size;
  
  // High switch frequency + short stays + multiple domains = Loop
  if (shortStays.length >= 6 && uniqueDomains >= 3) {
    const avgDuration = shortStays.reduce((acc, e) => acc + e.duration, 0) / shortStays.length;
    
    // Severity scales inversely with average duration
    // If avg is 5s, severity is higher than if avg is 25s
    const severity = Math.min(100, (30 - avgDuration) * 4);
    
    return {
      detected: true,
      severity,
      reason: `Rapid switching detected (Avg: ${Math.round(avgDuration)}s per site across ${uniqueDomains} domains).`
    };
  }

  return { detected: false, severity: 0 };
}

export function calculateFocusScore(
  productiveMinutes: number,
  distractingMinutes: number,
  sessions: FocusSession[],
  metrics: BehavioralMetrics,
  engagements: TabEngagement[] = []
): number {
  let score = 50; // Baseline

  // 1. Time-based weighting
  score += productiveMinutes * 0.5;
  score -= distractingMinutes * 1.5;

  // 2. Session Integrity
  const completedSessions = sessions.filter(s => s.completed).length;
  const brokenSessions = sessions.filter(s => !s.completed).length;
  
  // Severe penalty for "Micro-failures" (sessions broken in less than 5 minutes)
  const microFailures = sessions.filter(s => !s.completed && s.duration < 5).length;
  
  score += completedSessions * 10;
  score -= (brokenSessions * 15);
  score -= (microFailures * 20); // Stacked penalty for immediate abandonment

  // 3. Behavioral Impact (Refined for heavy penalties)
  const loopInfo = detectDopamineLoops(engagements);
  
  if (loopInfo.detected || metrics.dopamineLoopDetected) {
    const penalty = loopInfo.detected ? (loopInfo.severity / 2) + 15 : 25;
    score -= penalty;
  }
  
  // Exponentially penalize tab switching above a very low threshold (3 switches/min)
  if (metrics.tabSwitchFrequency > 3) {
    const excess = metrics.tabSwitchFrequency - 3;
    score -= (excess * 8); // Significantly higher penalty
  }

  // Penalty for procrastination index
  score -= (metrics.procrastinationScore / 4);

  // 4. Clamping
  return Math.min(Math.max(Math.round(score), 0), 100);
}

export function getDisciplineRequirements(state: DisciplineState) {
  let reqs;
  switch (state.level) {
    case 'Iron': reqs = { sessionDuration: 60, overrideFriction: 'Locked', color: '#C4A484' }; break;
    case 'Gold': reqs = { sessionDuration: 45, overrideFriction: 'Write 50 words', color: '#fbbf24' }; break;
    case 'Silver': reqs = { sessionDuration: 30, overrideFriction: 'Wait 60 seconds', color: '#94a3b8' }; break;
    default: reqs = { sessionDuration: 25, overrideFriction: 'Wait 30 seconds', color: '#888888' }; break;
  }

  if (state.isAutoTightened) {
    // Escalate friction
    if (reqs.overrideFriction === 'Wait 30 seconds') reqs.overrideFriction = 'Wait 60 seconds';
    else if (reqs.overrideFriction === 'Wait 60 seconds') reqs.overrideFriction = 'Write 50 words';
    else if (reqs.overrideFriction === 'Write 50 words') reqs.overrideFriction = 'Write 100 words';
  }

  return reqs;
}

export function updateDiscipline(current: DisciplineState, sessionSuccess: boolean): DisciplineState {
  let next = { ...current };
  
  if (sessionSuccess) {
    next.consecutiveSuccesses += 1;
    next.consecutiveBreaks = 0;
    next.isAutoTightened = false;
    next.progressionPoints += 10;
  } else {
    next.consecutiveSuccesses = 0;
    next.consecutiveBreaks += 1;
    next.progressionPoints = Math.max(0, next.progressionPoints - 5);
    
    if (next.consecutiveBreaks >= 3) {
      next.isAutoTightened = true;
    }
  }

  // Level Up Logic
  if (next.consecutiveSuccesses >= 10 && next.level === 'Gold') next.level = 'Iron';
  else if (next.consecutiveSuccesses >= 5 && next.level === 'Silver') next.level = 'Gold';
  else if (next.consecutiveSuccesses >= 3 && next.level === 'Bronze') next.level = 'Silver';

  return next;
}
