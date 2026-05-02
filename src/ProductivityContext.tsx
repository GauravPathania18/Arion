import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BehavioralMetrics, FocusSession, SiteUsage, DayData } from './types';
import { TabEngagement } from './services/behavioralEngine';

interface ProductivityContextType {
  // Current State
  isTracking: boolean;
  activeSession: FocusSession | null;
  currentMetrics: BehavioralMetrics;
  siteUsage: SiteUsage[];
  engagements: TabEngagement[];
  
  // Historical Data
  history: DayData[];
  
  // Actions
  startTracking: () => void;
  stopTracking: () => void;
  startSession: (durationMinutes: number) => void;
  endSession: (completed: boolean) => void;
  recordEngagment: (engagement: TabEngagement) => void;
  recordSiteUsage: (site: string, duration: number) => void;
  updateMetrics: (updates: Partial<BehavioralMetrics>) => void;
}

const ProductivityContext = createContext<ProductivityContextType | undefined>(undefined);

export function ProductivityProvider({ children }: { children: React.ReactNode }) {
  const [isTracking, setIsTracking] = useState(false);
  const [activeSession, setActiveSession] = useState<FocusSession | null>(null);
  const [currentMetrics, setCurrentMetrics] = useState<BehavioralMetrics>({
    tabSwitchFrequency: 0,
    dopamineLoopDetected: false,
    procrastinationScore: 0
  });
  const [siteUsage, setSiteUsage] = useState<SiteUsage[]>([]);
  const [engagements, setEngagements] = useState<TabEngagement[]>([]);
  const [history, setHistory] = useState<DayData[]>([]);

  // Load persistence (Mocking initial load for now)
  useEffect(() => {
    // In a real-world scenario, this would come from chrome.storage or a backend
    const savedHistory = localStorage.getItem('aura_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  const startTracking = useCallback(() => setIsTracking(true), []);
  const stopTracking = useCallback(() => setIsTracking(false), []);

  const startSession = useCallback((duration: number) => {
    setActiveSession({
      startTime: Date.now(),
      duration,
      completed: false,
      distractionsBlocked: 0
    });
  }, []);

  const endSession = useCallback((completed: boolean) => {
    if (!activeSession) return;
    
    const finishedSession = { ...activeSession, completed };
    // Here you would save to history
    setActiveSession(null);
  }, [activeSession]);

  const recordEngagment = useCallback((engagement: TabEngagement) => {
    setEngagements(prev => [engagement, ...prev].slice(0, 50));
  }, []);

  const recordSiteUsage = useCallback((site: string, duration: number) => {
    setSiteUsage(prev => {
      const existing = prev.find(s => s.domain === site);
      if (existing) {
        return prev.map(s => s.domain === site ? { 
          ...s, 
          timeSpent: s.timeSpent + duration,
          visits: s.visits + 1,
          lastVisited: Date.now()
        } : s);
      }
      return [...prev, { 
        domain: site, 
        timeSpent: duration, 
        category: 'neutral', 
        visits: 1,
        lastVisited: Date.now()
      }];
    });
  }, []);

  const updateMetrics = useCallback((updates: Partial<BehavioralMetrics>) => {
    setCurrentMetrics(prev => ({ ...prev, ...updates }));
  }, []);

  return (
    <ProductivityContext.Provider value={{
      isTracking,
      activeSession,
      currentMetrics,
      siteUsage,
      engagements,
      history,
      startTracking,
      stopTracking,
      startSession,
      endSession,
      recordEngagment,
      recordSiteUsage,
      updateMetrics
    }}>
      {children}
    </ProductivityContext.Provider>
  );
}

export function useProductivity() {
  const context = useContext(ProductivityContext);
  if (context === undefined) {
    throw new Error('useProductivity must be used within a ProductivityProvider');
  }
  return context;
}
