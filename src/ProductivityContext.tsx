import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BehavioralMetrics, FocusSession, SiteUsage, DayData } from './types';
import { TabEngagement, getSiteCategory } from './services/behavioralEngine';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';

interface ProductivityContextType {
  // Current State
  user: User | null;
  loading: boolean;
  isTracking: boolean;
  activeSession: FocusSession | null;
  lastFinishedSession: FocusSession | null;
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
  clearFinishedSession: () => void;
  recordEngagment: (engagement: TabEngagement) => void;
  recordSiteUsage: (site: string, duration: number) => void;
  updateMetrics: (updates: Partial<BehavioralMetrics>) => void;
}

const ProductivityContext = createContext<ProductivityContextType | undefined>(undefined);

export function ProductivityProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const [activeSession, setActiveSession] = useState<FocusSession | null>(null);
  const [lastFinishedSession, setLastFinishedSession] = useState<FocusSession | null>(null);
  const [currentMetrics, setCurrentMetrics] = useState<BehavioralMetrics>({
    tabSwitchFrequency: 0,
    dopamineLoopDetected: false,
    procrastinationScore: 0
  });
  const [siteUsage, setSiteUsage] = useState<SiteUsage[]>([]);
  const [engagements, setEngagements] = useState<TabEngagement[]>([]);
  const [history, setHistory] = useState<DayData[]>([]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Data Sync (Firestore -> State)
  useEffect(() => {
    if (!user) {
      setHistory([]);
      setSiteUsage([]);
      return;
    }

    const todayId = new Date().toISOString().split('T')[0];
    const historyRef = collection(db, 'users', user.uid, 'history');
    const sitesRef = collection(db, 'users', user.uid, 'history', todayId, 'sites');

    // Sync History
    const qHistory = query(historyRef, orderBy('date', 'desc'), limit(30));
    const unsubHistory = onSnapshot(qHistory, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as DayData);
      setHistory(data);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/history`));

    // Sync Today's Sites
    const unsubSites = onSnapshot(sitesRef, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as SiteUsage);
      setSiteUsage(data);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/history/${todayId}/sites`));

    return () => {
      unsubHistory();
      unsubSites();
    };
  }, [user]);

  const startTracking = useCallback(() => setIsTracking(true), []);
  const stopTracking = useCallback(() => setIsTracking(false), []);

  const startSession = useCallback(async (duration: number) => {
    if (!user) return;
    
    const sessionId = Date.now().toString();
    const session: FocusSession = {
      startTime: Date.now(),
      duration,
      completed: false,
      distractionsBlocked: 0
    };

    setActiveSession(session);

    try {
      await setDoc(doc(db, 'users', user.uid, 'sessions', sessionId), session);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/sessions/${sessionId}`);
    }
  }, [user]);

  const endSession = useCallback(async (completed: boolean) => {
    if (!activeSession || !user) return;
    
    const sessionId = activeSession.startTime.toString();
    const sessionRef = doc(db, 'users', user.uid, 'sessions', sessionId);
    const finishedSession = { ...activeSession, completed };

    try {
      await updateDoc(sessionRef, { completed });
      setLastFinishedSession(finishedSession);
      setActiveSession(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/sessions/${sessionId}`);
    }
  }, [activeSession, user]);

  const clearFinishedSession = useCallback(() => {
    setLastFinishedSession(null);
  }, []);

  const recordEngagment = useCallback((engagement: TabEngagement) => {
    setEngagements(prev => [engagement, ...prev].slice(0, 50));
  }, []);

  const recordSiteUsage = useCallback(async (site: string, duration: number) => {
    if (!user) return;
    
    const todayId = new Date().toISOString().split('T')[0];
    const siteId = site.replace(/\./g, '_'); // Safe ID
    const siteRef = doc(db, 'users', user.uid, 'history', todayId, 'sites', siteId);
    const category = getSiteCategory(site);

    try {
      const existingDoc = await getDoc(siteRef);
      if (existingDoc.exists()) {
        const data = existingDoc.data() as SiteUsage;
        await updateDoc(siteRef, {
          timeSpent: data.timeSpent + duration,
          visits: data.visits + 1,
          lastVisited: Date.now()
        });
      } else {
        await setDoc(siteRef, {
          domain: site,
          timeSpent: duration,
          category: category,
          visits: 1,
          lastVisited: Date.now()
        });
      }
      
      // Update DayData summary
      const dayRef = doc(db, 'users', user.uid, 'history', todayId);
      const dayDoc = await getDoc(dayRef);
      
      if (dayDoc.exists()) {
        const dayData = dayDoc.data();
        await updateDoc(dayRef, {
          totalActiveTime: (dayData.totalActiveTime || 0) + duration
        });
      } else {
        await setDoc(dayRef, {
          date: todayId,
          totalActiveTime: duration,
          focusScore: 70
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/history/${todayId}/sites/${siteId}`);
    }
  }, [user]);

  const updateMetrics = useCallback((updates: Partial<BehavioralMetrics>) => {
    setCurrentMetrics(prev => ({ ...prev, ...updates }));
  }, []);

  return (
    <ProductivityContext.Provider value={{
      user,
      loading,
      isTracking,
      activeSession,
      lastFinishedSession,
      currentMetrics,
      siteUsage,
      engagements,
      history,
      startTracking,
      stopTracking,
      startSession,
      endSession,
      clearFinishedSession,
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
