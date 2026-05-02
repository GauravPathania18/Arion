export interface SiteUsage {
  domain: string;
  timeSpent: number; // in seconds
  visits: number;
  category: 'productive' | 'distracting' | 'neutral';
  lastVisited: number;
}

export interface DayData {
  date: string; // YYYY-MM-DD
  totalActiveTime: number;
  focusScore: number;
  sites: SiteUsage[];
}

export interface BehavioralMetrics {
  tabSwitchFrequency: number; // switches per minute
  dopamineLoopDetected: boolean;
  procrastinationScore: number;
}

export interface FocusSession {
  startTime: number;
  duration: number;
  completed: boolean;
  distractionsBlocked: number;
}
