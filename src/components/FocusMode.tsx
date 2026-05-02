import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Shield, 
  Coffee,
  AlertTriangle,
  TrendingUp,
  Trophy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { DisciplineState, getDisciplineRequirements, updateDiscipline, detectDopamineLoops } from '../services/behavioralEngine';
import { useProductivity } from '../ProductivityContext';

export default function FocusMode() {
  const { startSession, endSession, activeSession, engagements, recordEngagment } = useProductivity();
  const [discipline, setDiscipline] = useState<DisciplineState>({
    level: 'Bronze',
    progressionPoints: 240,
    consecutiveSuccesses: 2,
    consecutiveBreaks: 0,
    isAutoTightened: false,
    strictness: 0.25
  });
  
  const requirements = getDisciplineRequirements(discipline);
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(requirements.sessionDuration * 60);
  const [isBlocking, setIsBlocking] = useState(true);
  const [blockedSites, setBlockedSites] = useState(['twitter.com', 'facebook.com', 'reddit.com', 'youtube.com']);
  const [newSite, setNewSite] = useState('');
  const [showDopamineWarning, setShowDopamineWarning] = useState(false);
  const [dopamineReason, setDopamineReason] = useState('');
  const [isCooldown, setIsCooldown] = useState(false);
  const [suggestion, setSuggestion] = useState<{ type: 'site' | 'duration', value: string } | null>(null);
  const [overrideTimeLeft, setOverrideTimeLeft] = useState(0);
  const [isOverridePending, setIsOverridePending] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [isOverrideSuccess, setIsOverrideSuccess] = useState(false);

  // Sync isActive with activeSession from context
  useEffect(() => {
    if (activeSession && !isActive) {
      setIsActive(true);
    } else if (!activeSession && isActive) {
      setIsActive(false);
    }
  }, [activeSession]);

  // Simulation: Override Timer Logic
  useEffect(() => {
    let interval: any;
    if (isOverridePending && overrideTimeLeft > 0) {
      interval = setInterval(() => {
        setOverrideTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (overrideTimeLeft === 0 && isOverridePending) {
      setIsOverridePending(false);
      // Once timer ends, if we had a reason, we successfully overrode for a period
      if (overrideReason) {
        setIsBlocking(false);
        setIsOverrideSuccess(true);
        setOverrideReason('');
        // Automatically re-engage after 5 minutes
        setTimeout(() => {
          setIsBlocking(true);
          setIsOverrideSuccess(false);
        }, 5 * 60 * 1000);
      }
    }
    return () => clearInterval(interval);
  }, [isOverridePending, overrideTimeLeft, overrideReason]);

  const triggerBreachProtocol = (reason?: string) => {
    const frictionSeconds = 
      discipline.level === 'Iron' ? 300 : 
      discipline.level === 'Gold' ? 120 : 
      discipline.level === 'Silver' ? 60 : 30;
    
    setOverrideTimeLeft(frictionSeconds);
    setIsOverridePending(true);
    if (reason) setOverrideReason(reason);
    
    // Use the central behavioral engine for state updates
    setDiscipline(prev => updateDiscipline(prev, false));
  };

  // Real-time Dopamine Loop Detection & Simulation
  useEffect(() => {
    if (!isActive || isCooldown) return;

    // Simulation: Periodically generate random engagements to test the system
    // In a real extension, these would be real tab switches
    const simulationInterval = setInterval(() => {
      const domains = ['twitter.com', 'reddit.com', 'youtube.com', 'news.ycombinator.com', 'github.com'];
      const randomDomain = domains[Math.floor(Math.random() * domains.length)];
      // Force a "micro-stay" simulation occasionally
      const duration = Math.random() > 0.7 ? Math.floor(Math.random() * 4) + 1 : Math.floor(Math.random() * 60) + 10;
      
      recordEngagment({
        domain: randomDomain,
        timestamp: Date.now(),
        duration
      });
    }, 8000); // Record a new "engagement" every 8s

    const analysis = detectDopamineLoops(engagements);
    if (analysis.detected) {
      setShowDopamineWarning(true);
      setDopamineReason(analysis.reason || 'Rapid switching detected');
      
      // Smart Suggestion Logic
      if (!suggestion) {
        const recent = engagements.slice(0, 10);
        if (recent.length > 0) {
          const domainCounts: Record<string, number> = {};
          recent.forEach(e => {
            domainCounts[e.domain] = (domainCounts[e.domain] || 0) + 1;
          });
          
          const sortedDomains = Object.entries(domainCounts)
            .sort((a, b) => b[1] - a[1]);
          
          const mostFrequent = sortedDomains[0]?.[0];
          const productiveDomains = ['github.com', 'stackoverflow.com', 'docs.google.com', 'notion.so', 'figma.com', 'linear.app', 'vercel.com'];
          const isProductive = productiveDomains.some(d => mostFrequent?.includes(d));

          if (isProductive) {
            setSuggestion({ type: 'duration', value: '15' });
          } else if (mostFrequent && !blockedSites.includes(mostFrequent)) {
            // Only suggest if it's not already blocked and not a productive domain
            setSuggestion({ type: 'site', value: mostFrequent });
          }
        }
      }
      
      // Auto-hide after 20s if not interacted with
      const timer = setTimeout(() => {
        setShowDopamineWarning(false);
      }, 20000);

      return () => {
        clearTimeout(timer);
        clearInterval(simulationInterval);
      };
    }
    
    return () => clearInterval(simulationInterval);
  }, [isActive, engagements, isCooldown, recordEngagment]);

  const resetFocus = () => {
    setShowDopamineWarning(false);
    setIsCooldown(true);
    // 1-minute cooldown before next warning
    setTimeout(() => setIsCooldown(false), 60 * 1000);
    
    // Boost time slightly as positive reinforcement for "resetting"
    setTimeLeft(prev => Math.min(requirements.sessionDuration * 60, prev + 30));
  };

  const continueBrowsing = () => {
    setShowDopamineWarning(false);
    setIsCooldown(true);
    // Longer 3-minute cooldown if they choose to continue anyway
    setTimeout(() => setIsCooldown(false), 3 * 60 * 1000);
  };

  const addSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSite && !blockedSites.includes(newSite.toLowerCase())) {
      setBlockedSites([...blockedSites, newSite.toLowerCase()]);
      setNewSite('');
    }
  };

  const removeSite = (siteToRemove: string) => {
    setBlockedSites(blockedSites.filter(site => site !== siteToRemove));
  };

  useEffect(() => {
    setTimeLeft(requirements.sessionDuration * 60);
  }, [discipline.level]);

  useEffect(() => {
    let interval: any;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      endSession(true);
      setDiscipline(prev => updateDiscipline(prev, true));
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, endSession]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progress = (timeLeft / (requirements.sessionDuration * 60)) * 100;
  const isLastMinute = timeLeft <= 60 && timeLeft > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-8">
      {/* Discipline Header */}
      <div className="flex items-center justify-between bg-aura-card border border-aura-border p-6 rounded-sm shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-aura-bg border border-aura-border rounded-sm">
            <Trophy className="w-6 h-6" style={{ color: requirements.color }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-serif italic tracking-tighter text-aura-primary">Focus Level: {discipline.level}</h2>
              {discipline.isAutoTightened && (
                <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-500 text-[8px] uppercase font-bold tracking-widest rounded-sm">
                  Extra Strict
                </span>
              )}
            </div>
            <div className="flex flex-col gap-3 mt-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className={cn(
                          "w-5 h-1.5 rounded-full transition-all duration-500",
                          i <= discipline.consecutiveSuccesses 
                            ? "bg-aura-primary shadow-[0_0_8px_rgba(196,164,132,0.4)]" 
                            : "bg-aura-border/40"
                        )} />
                      ))}
                    </div>
                    <p className="text-[10px] text-aura-text-muted uppercase font-bold tracking-widest">
                      Focus Streak
                    </p>
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-bold text-aura-primary tabular-nums">{discipline.progressionPoints}</span>
                  <span className="text-[9px] text-aura-text-muted uppercase font-bold tracking-tighter">Points Earned</span>
                </div>
              </div>

              {/* Advanced Progression Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-end px-0.5">
                  <p className="text-[9px] text-aura-text-muted uppercase font-black tracking-widest">
                    Next Level Progression
                  </p>
                  <p className="text-[10px] font-bold text-aura-primary">
                    {discipline.consecutiveSuccesses}/5 Sessions
                  </p>
                </div>
                <div className="h-2 w-full bg-aura-bg border border-aura-border rounded-full overflow-hidden relative">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(discipline.consecutiveSuccesses / 5) * 100}%` }}
                    className="h-full bg-aura-primary relative z-10"
                  />
                  {/* Subtle Grid markers */}
                  <div className="absolute inset-0 flex justify-between px-[20%]">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-full w-px bg-aura-border/30" />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-aura-border/30">
                <p className="text-[9px] text-aura-text-muted uppercase font-bold tracking-widest">
                  Recent Breaks
                </p>
                <div className="flex gap-1">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className={cn(
                      "w-3 h-1 rounded-full transition-all duration-500",
                      i <= discipline.consecutiveBreaks 
                        ? "bg-red-500/80 shadow-[0_0_6px_rgba(239,68,68,0.3)]" 
                        : "bg-aura-border/30"
                    )} />
                  ))}
                </div>
                {discipline.consecutiveBreaks > 0 && (
                  <p className="text-[9px] text-red-500 font-bold uppercase tracking-tighter ml-1">
                    {discipline.consecutiveBreaks}/3 Limit
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-aura-text-muted tracking-widest uppercase font-bold mb-1">How to Unblock</p>
          <p className="text-sm font-serif italic text-aura-primary">{requirements.overrideFriction}</p>
        </div>
      </div>

      {/* Timer Section */}
      <div className="flex flex-col items-center justify-center relative">
        {/* Completion Success Toast */}
        <AnimatePresence>
          {timeLeft === 0 && !isActive && discipline.consecutiveSuccesses > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute -top-12 z-50 bg-aura-primary text-aura-bg px-6 py-2 rounded-sm shadow-2xl flex items-center gap-3"
            >
              <Trophy className="w-4 h-4" />
              <span className="text-[10px] uppercase font-black tracking-widest">Session Complete +25 Points</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dopamine Warning Overlay & Adaptive Suggestions */}
        <AnimatePresence>
          {showDopamineWarning && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="absolute -top-32 z-50 flex flex-col gap-2 items-center"
            >
              <div className="bg-red-500 text-white px-6 py-4 rounded-sm shadow-2xl flex flex-col items-center gap-3 border border-red-400 max-w-[340px] text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-xs uppercase font-black tracking-[0.2em]">Dopamine Loop Detected</span>
                  </div>
                  <p className="text-[10px] leading-relaxed opacity-90 font-medium">
                    {dopamineReason.includes("under 5 seconds") || dopamineReason.includes("Rapid switching")
                      ? "You seem to be switching tabs very quickly! This can fragment your focus." 
                      : "Your browsing pattern suggests a dopamine loop. Try to slow down."}
                  </p>
                </div>
                <div className="flex flex-col gap-2 w-full mt-1">
                  <button 
                    onClick={resetFocus}
                    className="w-full bg-white text-red-500 hover:bg-white/90 px-4 py-2 rounded-sm text-[10px] uppercase font-black tracking-widest transition-all font-sans shadow-lg"
                  >
                    Reset Focus
                  </button>
                  <button 
                    onClick={continueBrowsing}
                    className="w-full bg-white/10 hover:bg-white/20 px-4 py-2 rounded-sm text-[9px] uppercase font-bold tracking-widest border border-white/10 transition-all font-sans"
                  >
                    Continue Browsing
                  </button>
                </div>
              </div>
              
              {suggestion && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-aura-card border border-aura-primary p-3 rounded-sm shadow-2xl flex flex-col items-center gap-2 max-w-[280px]"
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3 h-3 text-aura-primary" />
                  <p className="text-[9px] text-aura-text-muted uppercase font-bold tracking-widest text-center leading-tight">
                    {suggestion.type === 'site' 
                      ? `Frequent visits to ${suggestion.value} detected. Block it?`
                      : `You're working hard! Want to add ${suggestion.value}m to this session?`}
                  </p>
                </div>
                <div className="flex gap-2 w-full">
                  <button 
                    onClick={() => {
                      if (suggestion.type === 'site') setBlockedSites([...blockedSites, suggestion.value]);
                      else setTimeLeft(prev => prev + (parseInt(suggestion.value) * 60));
                      setSuggestion(null);
                    }}
                    className="flex-1 px-3 py-1 bg-aura-primary text-aura-bg text-[8px] uppercase font-bold tracking-widest rounded-sm"
                  >
                    Accept
                  </button>
                  <button 
                    onClick={() => setSuggestion(null)}
                    className="flex-1 px-3 py-1 bg-aura-bg border border-aura-border text-aura-text-muted text-[8px] uppercase font-bold tracking-widest rounded-sm"
                  >
                    Ignore
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

        <div className="relative w-80 h-80 flex items-center justify-center">
          {/* Animated Glow */}
          <div className={cn(
            "absolute inset-0 rounded-full blur-[100px] transition-all duration-1000 opacity-20",
            isActive ? (isLastMinute ? "bg-red-500" : "bg-aura-primary") : "bg-zinc-700"
          )} />
          
          <svg className="w-full h-full -rotate-90">
            <circle 
              cx="160" cy="160" r="140" 
              fill="transparent" 
              stroke="currentColor" 
              strokeWidth="4" 
              className="text-aura-border/30"
            />
            {/* Background dashed ring */}
            <circle 
              cx="160" cy="160" r="130" 
              fill="transparent" 
              stroke="currentColor" 
              strokeWidth="1" 
              strokeDasharray="4 8"
              className="text-aura-border/20"
            />
            <motion.circle 
              cx="160" cy="160" r="140" 
              fill="transparent" 
              stroke="currentColor" 
              strokeWidth="6" 
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 140}
              initial={{ strokeDashoffset: 0 }}
              animate={{ 
                strokeDashoffset: 2 * Math.PI * 140 * (1 - progress / 100),
                stroke: isLastMinute ? "#ef4444" : "#C4A484"
              }}
              transition={{ duration: 1, ease: 'linear' }}
              className="transition-colors duration-500"
            />
            
            {/* Pulse Ring when active */}
            {isActive && (
              <motion.circle
                cx="160" cy="160" r="140" 
                fill="transparent" 
                stroke="currentColor" 
                strokeWidth="12" 
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 140}
                animate={{ 
                  strokeDashoffset: 2 * Math.PI * 140 * (1 - progress / 100),
                  opacity: [0.1, 0, 0.1],
                  scale: [1, 1.05, 1],
                  stroke: isLastMinute ? "#ef4444" : "#C4A484"
                }}
                transition={{ 
                  strokeDashoffset: { duration: 1, ease: 'linear' },
                  opacity: { repeat: Infinity, duration: 2 },
                  scale: { repeat: Infinity, duration: 2 }
                }}
                className="origin-center"
              />
            )}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span 
              animate={isLastMinute && isActive ? { scale: [1, 1.05, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1 }}
              className={cn(
                "text-7xl font-serif font-bold tracking-tighter tabular-nums transition-colors duration-500",
                isLastMinute && isActive ? "text-red-500" : "text-aura-primary"
              )}
            >
              {formatTime(timeLeft)}
            </motion.span>
            <span className={cn(
              "text-[10px] mt-4 font-bold tracking-[0.3em] uppercase transition-colors",
              isLastMinute && isActive ? "text-red-500 animate-pulse" : "text-aura-text-muted text-aura-text-muted"
            )}>
              {isActive ? (isLastMinute ? 'Final Stretch' : 'In Session') : 'Ready to Focus'}
            </span>
            
            {/* Visual indicator for current work block */}
            <div className="mt-6 flex gap-1.5">
              {Array.from({ length: Math.ceil(requirements.sessionDuration / 15) }).map((_, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "w-1 h-1 rounded-full",
                    (timeLeft / 60) < (requirements.sessionDuration - (i * 15)) ? "bg-aura-primary" : "bg-aura-border"
                  )} 
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-12">
          <button 
            onClick={() => {
              if (isActive) {
                setDiscipline(prev => updateDiscipline(prev, false));
                endSession(false);
              } else {
                startSession(requirements.sessionDuration);
              }
            }}
            className="w-16 h-16 rounded-sm bg-aura-primary text-aura-bg flex items-center justify-center hover:scale-105 transition-transform active:scale-95 shadow-2xl shadow-aura-primary/20"
          >
            {isActive ? <Pause fill="currentColor" /> : <Play fill="currentColor" className="ml-1" />}
          </button>
          <button 
            onClick={() => { 
                if (isActive) {
                  setDiscipline(prev => updateDiscipline(prev, false));
                  endSession(false);
                }
                setTimeLeft(requirements.sessionDuration * 60); 
            }}
            className="w-12 h-12 rounded-sm bg-aura-bg border border-aura-border text-aura-text-muted flex items-center justify-center hover:text-aura-text-bright transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Guard Configuration */}
        <div className="bg-aura-card border border-aura-border p-6 rounded-sm shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-aura-primary" />
              <h3 className="font-serif italic tracking-wide">Focus Settings</h3>
            </div>
            <button 
              onClick={() => setIsBlocking(!isBlocking)}
              className={cn(
                "w-10 h-5 rounded-full p-0.5 transition-colors relative",
                isBlocking ? "bg-aura-primary" : "bg-aura-border"
              )}
            >
              <div className={cn(
                "w-4 h-4 bg-aura-bg rounded-full transition-transform",
                isBlocking ? "translate-x-5" : "translate-x-0"
              )} />
            </button>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Strict Blocking', desc: 'Blocks distractions instantly', active: true },
              { label: 'Timer Lock', desc: 'Lock the tab while focus timer is on', active: false },
              { label: 'Gray Mode', desc: 'Turn sites gray & hide images', active: true },
              { label: 'Tab Switch Alert', desc: 'Alerts when you switch tabs too often', active: true },
            ].map((rule) => (
              <div key={rule.label} className="p-4 bg-aura-bg border border-aura-border rounded-sm flex items-center justify-between group">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest">{rule.label}</p>
                  <p className="text-[10px] text-aura-text-muted mt-1">{rule.desc}</p>
                </div>
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  rule.active ? "bg-aura-primary shadow-[0_0_8px_rgba(196,164,132,0.5)]" : "bg-aura-border"
                )} />
              </div>
            ))}
          </div>
        </div>

        {/* Override Friction */}
        <div className="bg-aura-card border border-aura-border p-6 rounded-sm shadow-xl">
          <div className="flex items-center gap-3 mb-8">
            <AlertTriangle className="w-5 h-5 text-aura-primary" />
            <h3 className="font-serif italic tracking-wide">Wait Time</h3>
          </div>
          <p className="text-[10px] text-aura-text-muted mb-6 leading-relaxed uppercase tracking-wider font-bold">
            Staying focused helps you improve.
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Soft', val: '5s delay' },
              { label: 'Medium', val: '30s wait' },
              { label: 'Hard', val: 'Write 50 words' },
              { label: 'Iron', val: 'Unbreakable' },
            ].map((level) => (
              <button 
                key={level.label}
                className="p-3 bg-aura-bg border border-aura-border rounded-sm text-left hover:border-aura-primary/50 transition-all group"
              >
                <p className="text-[10px] font-bold text-aura-text-bright uppercase tracking-widest group-hover:text-aura-primary transition-colors">{level.label}</p>
                <p className="text-[9px] text-aura-text-muted mt-0.5 italic">{level.val}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Site Management */}
      <div className="bg-aura-card border border-aura-border p-6 rounded-sm shadow-2xl transition-all duration-300 relative overflow-hidden">
        {/* Override Pending Overlay */}
        {isOverridePending && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 bg-aura-bg/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center"
          >
            <AlertTriangle className="w-12 h-12 text-red-500 mb-4 animate-pulse" />
            <h3 className="text-xl font-serif italic text-aura-primary mb-2">Stop! Focus first.</h3>
            <p className="text-[10px] text-aura-text-muted uppercase tracking-[0.3em] mb-8 font-bold">Waiting time active</p>
            
            <div className="text-6xl font-serif text-aura-text-bright tabular-nums mb-4">
              {overrideTimeLeft}s
            </div>
            
            {overrideReason && (
              <div className="mb-6 p-4 bg-aura-primary/5 border border-aura-primary/20 rounded-sm">
                <p className="text-[10px] text-aura-text-muted uppercase tracking-widest font-bold mb-1">Your Reason:</p>
                <p className="text-sm font-serif italic text-aura-primary">"{overrideReason}"</p>
              </div>
            )}
            
            <p className="text-[9px] text-red-500/80 uppercase tracking-widest italic max-w-sm">
              You are almost there. Keep going!
            </p>
          </motion.div>
        )}

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Shield className={cn("w-5 h-5", isBlocking ? "text-aura-primary" : "text-green-500")} />
            <h3 className="font-serif italic tracking-wide">
              {isBlocking ? "Blocked Sites" : "Sites Unblocked"}
            </h3>
            {isOverrideSuccess && (
              <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-500 text-[8px] uppercase font-bold tracking-[0.2em] rounded-sm animate-pulse ml-2">
                Break Time
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {isBlocking && (
              <button 
                onClick={() => {
                  const reason = prompt("Enter your reason for unblocking:");
                  if (reason) triggerBreachProtocol(reason);
                }}
                className="px-3 py-1 border border-aura-primary/30 text-aura-primary text-[8px] uppercase font-bold tracking-widest rounded-sm hover:bg-aura-primary/10 transition-colors"
              >
                Ask to Unblock
              </button>
            )}
            <button 
              onClick={() => triggerBreachProtocol()}
              className="px-3 py-1 border border-red-500/30 text-red-500 text-[8px] uppercase font-bold tracking-widest rounded-sm hover:bg-red-500/10 transition-colors"
            >
              Test Blocking
            </button>
          </div>
        </div>
        
        <form onSubmit={addSite} className="flex flex-col gap-3 mb-6">
          <label className="text-[10px] text-aura-text-muted uppercase font-bold tracking-widest ml-1">Add a website you find distracting:</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={newSite}
              onChange={(e) => setNewSite(e.target.value)}
              placeholder="e.g. youtube.com" 
              className="flex-1 bg-aura-bg border border-aura-border rounded-sm px-4 py-3 text-xs placeholder:italic focus:outline-none focus:border-aura-primary transition-colors text-aura-text-bright"
            />
            <button 
              type="submit"
              className="px-6 py-2 bg-aura-primary text-aura-bg text-[10px] uppercase font-bold tracking-widest rounded-sm hover:scale-105 transition-all"
            >
              Block Site
            </button>
          </div>
        </form>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {blockedSites.map((site) => (
            <div 
              key={site} 
              className="flex items-center justify-between p-3 bg-aura-bg border border-aura-border rounded-sm group hover:border-aura-primary/30 transition-all"
            >
              <span className="text-[10px] font-mono text-aura-text-muted truncate mr-2 italic">{site}</span>
              <button 
                onClick={() => removeSite(site)}
                className="text-[10px] text-red-500/50 hover:text-red-500 font-bold opacity-0 group-hover:opacity-100 transition-all uppercase tracking-tighter"
              >
                Unblock
              </button>
            </div>
          ))}
        </div>
        
        {blockedSites.length === 0 && (
          <div className="text-center py-8 border border-dashed border-aura-border rounded-sm">
            <p className="text-[10px] text-aura-text-muted uppercase tracking-widest italic">No restrictions active. Your perimeter is open.</p>
          </div>
        )}
      </div>
    </div>
  );
}
