import { SiteUsage, FocusSession, BehavioralMetrics } from '../types';
import { PRODUCTIVE_SITES, DISTRACTING_SITES } from '../constants';

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


export function getSiteCategory(domain: string): 'productive' | 'distracting' | 'neutral' {
  if (PRODUCTIVE_SITES.some(p => domain.includes(p))) return 'productive';
  if (DISTRACTING_SITES.some(d => domain.includes(d))) return 'distracting';
  return 'neutral';
}

/**
 * Refined Dopamine Loop Detection
 * Penalizes rapid switching between different high-stimulation domains.
 * Specifically targets "micro-stays" (< 5s) and rapid engagement gaps.
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
  
  // Categorize stays
  const microStays = window.filter(e => e.duration < 5);
  const shortStays = window.filter(e => e.duration < 30);
  const uniqueDomains = new Set(window.map(e => e.domain)).size;

  // Calculate gaps between transitions
  let totalGap = 0;
  for (let i = 0; i < window.length - 1; i++) {
    // Gap in seconds
    const gap = Math.abs(window[i].timestamp - window[i+1].timestamp) / 1000;
    totalGap += gap;
  }
  const avgGap = totalGap / (window.length - 1);
  
  // Recognition logic: Loop is detected if user is bouncing between unique sites or 
  // having many extremely short engagements in a row.
  const isLoop = (shortStays.length >= 6 && uniqueDomains >= 3) || 
                 (microStays.length >= 4 && uniqueDomains >= 2) ||
                 (avgGap < 15 && shortStays.length >= 5);

  if (isLoop) {
    // Severity Calculation:
    // 1. Base on count of micro-stays (highest penalty)
    // 2. Base on breadth of sites
    // 3. Base on how fast the switching is (avgGap)
    let severity = (microStays.length * 12) + (shortStays.length * 4) + (uniqueDomains * 5);
    
    // Extra penalty for extremely narrow gaps (panic switching)
    if (avgGap < 10) {
      severity += (10 - avgGap) * 4;
    }

    severity = Math.min(100, severity);
    
    let reason = `Rapid switching detected (Avg: ${Math.round(avgGap)}s gaps between sites).`;
    if (microStays.length >= 4) {
      reason = `Micro-loop identified: ${microStays.length} visits under 5 seconds across ${uniqueDomains} sites.`;
    } else if (uniqueDomains >= 4) {
      reason = `Attention fragmentation: Extreme site hopping detected.`;
    }
    
    return {
      detected: true,
      severity,
      reason
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
    next.progressionPoints += 25; // More points for success
  } else {
    next.consecutiveSuccesses = 0; // Break resets focus progress
    next.consecutiveBreaks += 1;
    next.progressionPoints = Math.max(0, next.progressionPoints - 15);
    
    // Tighten protocol if user breaks repeatedly
    if (next.consecutiveBreaks >= 2) {
      next.isAutoTightened = true;
    }
  }

  // Consistent Level Up Logic (5 wins to advance)
  if (next.consecutiveSuccesses >= 5) {
    if (next.level === 'Bronze') next.level = 'Silver';
    else if (next.level === 'Silver') next.level = 'Gold';
    else if (next.level === 'Gold') next.level = 'Iron';
    next.consecutiveSuccesses = 0; // Reset streak after level up
  }

  return next;
}
