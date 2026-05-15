import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Target, 
  BrainCircuit, 
  Settings as SettingsIcon, 
  Chrome, 
  Zap,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Dashboard from './components/Dashboard';
import FocusMode from './components/FocusMode';
import Insights from './components/Insights';
import Settings from './components/Settings';
import ExtensionCode from './components/ExtensionCode';
import { cn } from './lib/utils';
import { ProductivityProvider, useProductivity } from './ProductivityContext';
import { ThemeProvider } from './ThemeContext';
import { signInWithGoogle, signOut } from './lib/supabase';
import { generateSessionSummary } from './services/geminiService';
import { PRODUCTIVE_SITES, DISTRACTING_SITES } from './constants';
import Markdown from 'react-markdown';

function SessionSummaryModal() {
  const { lastFinishedSession, siteUsage, currentMetrics, clearFinishedSession } = useProductivity();
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lastFinishedSession && !summary && !loading) {
      const getSummary = async () => {
        setLoading(true);
        const result = await generateSessionSummary(lastFinishedSession, siteUsage, currentMetrics);
        setSummary(result || "Session summary unavailable.");
        setLoading(false);
      };
      getSummary();
    }
  }, [lastFinishedSession, siteUsage, currentMetrics, summary, loading]);

  if (!lastFinishedSession) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-arion-bg/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-arion-card border border-arion-primary/30 p-8 rounded-sm shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-arion-primary shadow-[0_0_15px_rgba(196,164,132,0.5)]" />
        
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-12 h-12 bg-arion-primary/10 rounded-full flex items-center justify-center border border-arion-primary/20">
            <BrainCircuit className="text-arion-primary w-6 h-6 animate-pulse" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-serif italic tracking-widest text-arion-primary">Session Debrief</h2>
            <p className="text-[10px] text-arion-text-muted uppercase font-black tracking-[0.2em]">
              Neuro-Performance Analysis
            </p>
          </div>

          <div className="w-full bg-arion-bg/50 border border-arion-border p-6 rounded-sm min-h-[160px] flex flex-col justify-center">
            {loading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-6 h-6 border-2 border-arion-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] text-arion-text-muted uppercase font-bold animate-pulse">Consulting AI Performance Lab...</p>
              </div>
            ) : (
              <div className="prose prose-invert prose-sm max-w-none text-left prose-p:text-arion-text-bright prose-p:leading-relaxed prose-p:text-xs">
                <Markdown>{summary}</Markdown>
              </div>
            )}
          </div>

          <button 
            onClick={() => {
              setSummary(null);
              clearFinishedSession();
            }}
            className="w-full bg-arion-primary text-arion-bg py-3 font-black uppercase tracking-[0.2em] text-[10px] hover:bg-arion-primary/90 transition-all shadow-lg"
          >
            Acknowledge & Sync
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'focus' | 'insights' | 'settings' | 'extension'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, loading, recordEngagment, recordSiteUsage } = useProductivity();

  // "Real Data Ready" Simulation: Feeding live usage data into the system
  useEffect(() => {
    if (!user) return;

    const simulationInterval = setInterval(() => {
      const sites = [...PRODUCTIVE_SITES.slice(0, 3), ...DISTRACTING_SITES.slice(0, 3)];
      const randomSite = sites[Math.floor(Math.random() * sites.length)];
      const duration = Math.floor(Math.random() * 60) + 10; // 10-70 seconds
      
      recordSiteUsage(randomSite, duration);
      recordEngagment({
        domain: randomSite,
        timestamp: Date.now(),
        duration
      });
    }, 15000); // Every 15 seconds simulate a new site engagement

    return () => clearInterval(simulationInterval);
  }, [recordEngagment, recordSiteUsage, user]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'focus', label: 'Focus Mode', icon: Target },
    { id: 'insights', label: 'AI Insights', icon: BrainCircuit },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
    { id: 'extension', label: 'Extension Setup', icon: Chrome },
  ];

  if (loading) {
    return (
      <div className="h-screen bg-arion-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-arion-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen bg-arion-bg flex flex-col items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-arion-primary rounded-xl flex items-center justify-center shadow-2xl">
              <Zap className="text-arion-bg w-10 h-10 fill-current" />
            </div>
            <h1 className="text-4xl font-serif italic tracking-widest text-arion-primary">ARION</h1>
            <p className="text-arion-text-muted text-sm tracking-wide uppercase font-bold">
              Cognitive Performance & Focus Lab
            </p>
          </div>
          
          <div className="bg-arion-card border border-arion-border p-8 rounded-sm space-y-6">
            <p className="text-arion-text-bright text-sm leading-relaxed">
              Align your digital habits with your biological focus cycles. 
              Securely sync your productivity data across devices.
            </p>
            <button
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-3 bg-arion-primary text-arion-bg py-3 px-6 rounded-sm font-black uppercase tracking-[0.2em] text-xs hover:bg-arion-primary/90 transition-all shadow-[0_0_20px_rgba(196,164,132,0.3)]"
            >
              Initialize Arion with Google
            </button>
          </div>
          
          <p className="text-[10px] text-arion-text-muted uppercase tracking-widest font-bold">
            Beta Access v1.0.2 • Powered by Gemini Pro
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-arion-bg overflow-hidden text-arion-text-bright flex-col md:flex-row">
      {/* Session Summary Modal Overlay */}
      <SessionSummaryModal />

      {/* Mobile Header */}
      <header className="md:hidden border-b border-arion-border bg-arion-bg p-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-arion-primary rounded-sm flex items-center justify-center">
            <Zap className="text-arion-bg w-5 h-5 fill-current" />
          </div>
          <h1 className="text-lg font-serif italic tracking-widest text-arion-primary">ARION</h1>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 text-arion-text-muted hover:text-arion-primary transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[50] md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 border-r border-arion-border bg-arion-bg z-[60] flex flex-col transition-transform duration-300 md:relative md:translate-x-0 outline-none",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 md:block hidden">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-arion-primary rounded-sm flex items-center justify-center">
              <Zap className="text-arion-bg w-5 h-5 fill-current" />
            </div>
            <h1 className="text-xl font-serif italic tracking-widest text-arion-primary">ARION</h1>
          </div>
        </div>

        <div className="p-6 md:hidden flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-arion-primary rounded-sm flex items-center justify-center">
              <Zap className="text-arion-bg w-5 h-5 fill-current" />
            </div>
            <h1 className="text-xl font-serif italic tracking-widest text-arion-primary">ARION</h1>
          </div>
          <button onClick={() => setIsSidebarOpen(false)}>
            <X className="w-6 h-6 text-arion-text-muted" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as any);
                setIsSidebarOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-xs font-semibold uppercase tracking-wider transition-all duration-200",
                activeTab === item.id 
                  ? "bg-arion-primary/10 text-arion-primary border border-arion-primary/20" 
                  : "text-arion-text-muted hover:text-arion-text-bright hover:bg-arion-card"
              )}
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-arion-border space-y-4">
          <div className="flex items-center gap-3 px-2">
            <img 
              src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.user_metadata?.full_name || 'User'}`} 
              alt="Avatar" 
              className="w-8 h-8 rounded-sm grayscale hover:grayscale-0 transition-all border border-arion-border/50"
            />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest truncate">{user.user_metadata?.full_name || user.email}</p>
              <button 
                onClick={signOut}
                className="text-[9px] text-arion-text-muted hover:text-red-500 uppercase font-bold tracking-tighter transition-colors"
              >
                Deactivate Session
              </button>
            </div>
          </div>
          
          <div className="p-4 bg-arion-card/50 rounded-sm border border-arion-border select-none">
            <div className="flex items-center gap-2 text-[10px] font-bold text-arion-primary uppercase tracking-widest mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-arion-primary animate-pulse shadow-[0_0_8px_rgba(196,164,132,0.6)]" />
              Live sync active
            </div>
            <p className="text-[10px] text-arion-text-muted leading-relaxed font-mono truncate">
              {user.email}
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth bg-arion-bg">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto"
          >
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'focus' && <FocusMode />}
            {activeTab === 'insights' && <Insights />}
            {activeTab === 'settings' && <Settings />}
            {activeTab === 'extension' && <ExtensionCode />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ProductivityProvider>
        <AppContent />
      </ProductivityProvider>
    </ThemeProvider>
  );
}
