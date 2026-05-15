import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BehavioralMetrics, FocusSession, SiteUsage, DayData, UserSettings } from './types';
import { TabEngagement, getSiteCategory } from './services/behavioralEngine';
import { supabase, User } from './lib/supabase';
import { PRODUCTIVE_SITES, DISTRACTING_SITES } from './constants';

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
  settings: UserSettings;
  
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
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  signOut: () => Promise<void>;
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
  const [settings, setSettings] = useState<UserSettings>({
    defaultSessionDuration: 25,
    blockedSites: [...DISTRACTING_SITES],
    incognitoBlocker: true
  });

  // Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Data Fetching and Subscriptions
  useEffect(() => {
    if (!user) {
      setHistory([]);
      setSiteUsage([]);
      return;
    }

    const todayId = new Date().toISOString().split('T')[0];

    async function fetchData() {
      // Fetch History
      const { data: historyData } = await supabase
        .from('day_data')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(30);
      
      if (historyData) {
        setHistory(historyData.map(d => ({
          date: d.date,
          totalActiveTime: d.total_active_time,
          focusScore: d.focus_score,
          sites: [] // Historical sites fetched on demand or kept empty for summary
        })));
      }

      // Fetch Today's Sites
      const { data: sitesData } = await supabase
        .from('site_usage')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', todayId);
      
      if (sitesData) {
        setSiteUsage(sitesData.map(s => ({
          domain: s.domain,
          timeSpent: s.time_spent,
          category: s.category,
          visits: s.visits,
          lastVisited: new Date(s.last_visited).getTime()
        })));
      }

      // Fetch Settings
      const { data: settingsData } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (settingsData) {
        setSettings({
          defaultSessionDuration: settingsData.default_session_duration,
          blockedSites: settingsData.blocked_sites,
          incognitoBlocker: settingsData.incognito_blocker,
          notionToken: settingsData.notion_token,
          notionDatabaseId: settingsData.notion_database_id
        });
      } else {
        // Initialize settings if they don't exist
        await supabase.from('settings').insert({
          user_id: user.id,
          default_session_duration: 25,
          blocked_sites: [...DISTRACTING_SITES],
          incognito_blocker: true
        });
      }
    }

    fetchData();

    // Set up real-time subscriptions
    const settingsChannel = supabase
      .channel('settings-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'settings',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        const newData = payload.new as any;
        setSettings({
          defaultSessionDuration: newData.default_session_duration,
          blockedSites: newData.blocked_sites,
          incognitoBlocker: newData.incognito_blocker,
          notionToken: newData.notion_token,
          notionDatabaseId: newData.notion_database_id
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(settingsChannel);
    };
  }, [user]);

  const startTracking = useCallback(() => setIsTracking(true), []);
  const stopTracking = useCallback(() => setIsTracking(false), []);

  const startSession = useCallback(async (duration: number) => {
    if (!user) return;
    
    const session: FocusSession = {
      startTime: Date.now(),
      duration,
      completed: false,
      distractionsBlocked: 0
    };

    setActiveSession(session);

    await supabase.from('focus_sessions').insert({
      user_id: user.id,
      start_time: new Date(session.startTime).toISOString(),
      duration: session.duration,
      completed: session.completed,
      distractions_blocked: session.distractionsBlocked
    });
  }, [user]);

  const endSession = useCallback(async (completed: boolean) => {
    if (!activeSession || !user) return;
    
    const startTimeStamp = new Date(activeSession.startTime).toISOString();
    const finishedSession = { ...activeSession, completed };

    await supabase
      .from('focus_sessions')
      .update({ completed })
      .eq('user_id', user.id)
      .eq('start_time', startTimeStamp);

    setLastFinishedSession(finishedSession);
    setActiveSession(null);
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
    const category = getSiteCategory(site);

    // Update Site Usage
    const { data: existingSite } = await supabase
      .from('site_usage')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', todayId)
      .eq('domain', site)
      .single();

    if (existingSite) {
      await supabase
        .from('site_usage')
        .update({
          time_spent: existingSite.time_spent + duration,
          visits: existingSite.visits + 1,
          last_visited: new Date().toISOString()
        })
        .eq('id', existingSite.id);
    } else {
      await supabase.from('site_usage').insert({
        user_id: user.id,
        date: todayId,
        domain: site,
        time_spent: duration,
        category: category,
        visits: 1,
        last_visited: new Date().toISOString()
      });
    }

    // Refresh site usage state for today
    const { data: todaySites } = await supabase
      .from('site_usage')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', todayId);
    
    if (todaySites) {
      setSiteUsage(todaySites.map(s => ({
        domain: s.domain,
        timeSpent: s.time_spent,
        category: s.category,
        visits: s.visits,
        lastVisited: new Date(s.last_visited).getTime()
      })));
    }

    // Update Day Data summary
    const { data: dayData } = await supabase
      .from('day_data')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', todayId)
      .single();

    if (dayData) {
      await supabase
        .from('day_data')
        .update({
          total_active_time: (dayData.total_active_time || 0) + duration
        })
        .eq('id', dayData.id);
    } else {
      await supabase.from('day_data').insert({
        user_id: user.id,
        date: todayId,
        total_active_time: duration,
        focus_score: 70
      });
    }

    // Refresh history
    const { data: historyData } = await supabase
      .from('day_data')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(30);
    
    if (historyData) {
      setHistory(historyData.map(d => ({
        date: d.date,
        totalActiveTime: d.total_active_time,
        focusScore: d.focus_score,
        sites: [] 
      })));
    }
  }, [user]);

  const updateMetrics = useCallback((updates: Partial<BehavioralMetrics>) => {
    setCurrentMetrics(prev => ({ ...prev, ...updates }));
  }, []);

  const updateSettings = useCallback(async (updates: Partial<UserSettings>) => {
    if (!user) return;
    
    const dbUpdates: any = {};
    if (updates.defaultSessionDuration !== undefined) dbUpdates.default_session_duration = updates.defaultSessionDuration;
    if (updates.blockedSites !== undefined) dbUpdates.blocked_sites = updates.blockedSites;
    if (updates.incognitoBlocker !== undefined) dbUpdates.incognito_blocker = updates.incognitoBlocker;
    if (updates.notionToken !== undefined) dbUpdates.notion_token = updates.notionToken;
    if (updates.notionDatabaseId !== undefined) dbUpdates.notion_database_id = updates.notionDatabaseId;

    await supabase
      .from('settings')
      .update(dbUpdates)
      .eq('user_id', user.id);
    
    setSettings(prev => ({ ...prev, ...updates }));
  }, [user]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
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
      settings,
      startTracking,
      stopTracking,
      startSession,
      endSession,
      clearFinishedSession,
      recordEngagment,
      recordSiteUsage,
      updateMetrics,
      updateSettings,
      signOut
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
