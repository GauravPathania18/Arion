import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Target, 
  BrainCircuit, 
  Settings as SettingsIcon, 
  Chrome, 
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Dashboard from './components/Dashboard';
import FocusMode from './components/FocusMode';
import Insights from './components/Insights';
import Settings from './components/Settings';
import ExtensionCode from './components/ExtensionCode';
import { cn } from './lib/utils';
import { ProductivityProvider, useProductivity } from './ProductivityContext';

function AppContent() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'focus' | 'insights' | 'settings' | 'extension'>('dashboard');
  const { recordEngagment, recordSiteUsage } = useProductivity();

  // "Real Data Ready" Simulation: Feeding live usage data into the system
  useEffect(() => {
    const simulationInterval = setInterval(() => {
      const sites = ['github.com', 'stackoverflow.com', 'youtube.com', 'twitter.com', 'news.ycombinator.com'];
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
  }, [recordEngagment, recordSiteUsage]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'focus', label: 'Focus Mode', icon: Target },
    { id: 'insights', label: 'AI Insights', icon: BrainCircuit },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
    { id: 'extension', label: 'Extension Setup', icon: Chrome },
  ];

  return (
    <div className="flex h-screen bg-aura-bg overflow-hidden text-aura-text-bright">
      {/* Sidebar */}
      <aside className="w-64 border-r border-aura-border bg-aura-bg flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-aura-primary rounded-sm flex items-center justify-center">
              <Zap className="text-aura-bg w-5 h-5 fill-current" />
            </div>
            <h1 className="text-xl font-serif italic tracking-widest text-aura-primary">AURA AI</h1>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-xs font-semibold uppercase tracking-wider transition-all duration-200",
                activeTab === item.id 
                  ? "bg-aura-primary/10 text-aura-primary border border-aura-primary/20" 
                  : "text-aura-text-muted hover:text-aura-text-bright hover:bg-aura-card"
              )}
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-aura-border">
          <div className="p-4 bg-aura-card rounded-sm border border-aura-border">
            <div className="flex items-center gap-2 text-[10px] font-bold text-aura-primary uppercase tracking-widest mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-aura-primary animate-pulse" />
              Live sync active
            </div>
            <p className="text-[10px] text-aura-text-muted leading-relaxed">
              Paired with Chrome Extension v1.0.2
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-8 max-w-7xl mx-auto"
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
    <ProductivityProvider>
      <AppContent />
    </ProductivityProvider>
  );
}
