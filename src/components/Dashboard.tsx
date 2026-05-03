import React, { useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Zap, 
  Clock, 
  ArrowDownRight,
  Monitor,
  MousePointer2,
  Brain,
  Timer
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { calculateFocusScore, getSiteCategory } from '../services/behavioralEngine';
import { PRODUCTIVE_SITES, DISTRACTING_SITES } from '../constants';
import { useProductivity } from '../ProductivityContext';

// Default history if none exists in context
const defaultHistory = [
  { time: '9 AM', focus: 85, distractions: 12 },
  { time: '11 AM', focus: 92, distractions: 5 },
  { time: '1 PM', focus: 65, distractions: 28 },
  { time: '3 PM', focus: 78, distractions: 15 },
  { time: '5 PM', focus: 88, distractions: 8 },
  { time: '7 PM', focus: 45, distractions: 45 },
  { time: '9 PM', focus: 30, distractions: 60 },
];

export default function Dashboard() {
  const { currentMetrics, siteUsage, engagements, activeSession, history } = useProductivity();

  const { productiveMinutes, distractingMinutes } = useMemo(() => {
    let pTime = 0;
    let dTime = 0;

    siteUsage.forEach(site => {
      if (PRODUCTIVE_SITES.some(p => site.domain.includes(p))) pTime += site.timeSpent;
      else if (DISTRACTING_SITES.some(d => site.domain.includes(d))) dTime += site.timeSpent;
    });

    return {
      productiveMinutes: Math.round(pTime / 60),
      distractingMinutes: Math.round(dTime / 60)
    };
  }, [siteUsage]);

  const currentScore = useMemo(() => calculateFocusScore(
    productiveMinutes,
    distractingMinutes,
    activeSession ? [activeSession] : [],
    currentMetrics,
    engagements
  ), [productiveMinutes, distractingMinutes, currentMetrics, engagements, activeSession]);

  const categoryData = useMemo(() => {
    if (siteUsage.length === 0) {
      return [
        { name: 'Productive', value: 65, color: 'var(--arion-primary)' },
        { name: 'Distracting', value: 25, color: '#ef4444' },
        { name: 'Neutral', value: 10, color: '#3f3f46' },
      ];
    }

    const total = (productiveMinutes + distractingMinutes + 5) || 1; // Add buffer for neutral
    return [
      { name: 'Productive', value: Math.round((productiveMinutes / total) * 100) || 0, color: 'var(--arion-primary)' },
      { name: 'Distracting', value: Math.round((distractingMinutes / total) * 100) || 0, color: '#ef4444' },
      { name: 'Neutral', value: Math.max(0, 100 - Math.round((productiveMinutes / total) * 100) - Math.round((distractingMinutes / total) * 100)), color: '#3f3f46' },
    ];
  }, [siteUsage, productiveMinutes, distractingMinutes]);

  // Transform real history to chart format if needed, or use default
  const chartData = useMemo(() => {
    // If we have recent engagements, we can show a more granular "Intensity" chart for today
    if (engagements.length > 0) {
      const now = new Date();
      // Round to nearest 10m to align segments
      const roundedNow = new Date(now);
      roundedNow.setMinutes(Math.floor(roundedNow.getMinutes() / 10) * 10);
      roundedNow.setSeconds(0);
      roundedNow.setMilliseconds(0);

      const last6Hours = now.getTime() - (6 * 60 * 60 * 1000);
      const recentEngagements = engagements.filter(e => e.timestamp > last6Hours);
      
      if (recentEngagements.length > 3) {
        // Group by 10-minute segments for more granularity
        const segments: Record<string, { focus: number, distractions: number, count: number }> = {};
        
        // Initialize segments to ensure continuity
        for (let i = 0; i < 36; i++) {
          const time = new Date(roundedNow.getTime() - (i * 10 * 60 * 1000));
          const key = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
          segments[key] = { focus: 0, distractions: 0, count: 0 };
        }

        recentEngagements.forEach(e => {
          const time = new Date(e.timestamp);
          time.setMinutes(Math.floor(time.getMinutes() / 10) * 10);
          time.setSeconds(0);
          time.setMilliseconds(0);
          const key = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
          
          if (segments[key]) {
            const category = getSiteCategory(e.domain);
            if (category === 'productive') segments[key].focus += e.duration;
            else if (category === 'distracting') segments[key].distractions += e.duration;
            segments[key].count += 1;
          }
        });

        return Object.entries(segments)
          .reverse()
          .map(([time, data]) => {
            const hasData = data.count > 0;
            const total = (data.focus + data.distractions) || 1;
            const focusScore = hasData 
              ? Math.max(30, Math.round((data.focus / total) * 100)) 
              : 20; // Lower baseline for inactivity
              
            return {
              time,
              focus: focusScore,
              distractions: hasData ? Math.round((data.distractions / total) * 100) : 0,
              hasData
            };
          });
      }
    }

    if (history.length === 0) return defaultHistory;
    
    // Sort chronological for chart
    return [...history].reverse().map(day => {
      const dateObj = new Date(day.date);
      const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      return {
        time: formattedDate,
        focus: day.focusScore,
        distractions: Math.max(0, 100 - day.focusScore),
        hasData: true
      };
    });
  }, [history, engagements]);

  const peakIntensity = useMemo(() => {
    if (chartData.length === 0) return 0;
    return Math.max(...chartData.map(d => d.focus));
  }, [chartData]);

  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-arion-bg/95 border border-arion-border p-3 shadow-2xl backdrop-blur-md rounded-sm">
          <p className="text-[10px] text-arion-text-muted uppercase font-bold tracking-widest mb-2 border-b border-arion-border/30 pb-1">{label}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[10px] uppercase font-bold text-arion-primary">Focus Index</span>
              <span className="text-xs font-serif italic text-arion-text-bright">{payload[0].value}/100</span>
            </div>
            {payload[1] && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] uppercase font-bold text-red-500/80">Distraction</span>
                <span className="text-xs font-serif italic text-red-400">{payload[1].value}%</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Live Focus Score', value: currentScore.toString(), suffix: '/100', icon: Zap, trend: '+5%', trendUp: true },
          { label: 'Deep Work', value: activeSession ? (activeSession.duration / 60).toFixed(1) : '0.0', suffix: 'hrs', icon: Clock, trend: '+1.2', trendUp: true },
          { label: 'Distracted Time', value: Math.round(siteUsage.reduce((acc, s) => acc + s.timeSpent, 0) / 60).toString(), suffix: 'min', icon: ArrowDownRight, trend: '-15%', trendUp: true },
          { label: 'Tab Switches', value: currentMetrics.tabSwitchFrequency.toFixed(1), suffix: 'sw/m', icon: Timer, trend: currentMetrics.tabSwitchFrequency > 5 ? 'High' : 'Stable', trendUp: currentMetrics.tabSwitchFrequency < 5 },
        ].map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label} 
            className="bg-arion-card border border-arion-border p-6 rounded-sm shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-arion-card border border-arion-border rounded-sm">
                <stat.icon className="w-4 h-4 text-arion-primary" />
              </div>
              {stat.trend && (
                <div className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                  stat.trendUp === true ? "border-emerald-500/20 text-emerald-500 bg-emerald-500/5" : 
                  stat.trendUp === false ? "border-red-500/20 text-red-500 bg-red-500/5" : "border-arion-border text-arion-text-muted"
                )}>
                  {stat.trend}
                </div>
              )}
            </div>
            <div>
              <p className="text-arion-text-muted text-[10px] uppercase tracking-widest mb-1">{stat.label}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-serif text-arion-primary">{stat.value}</span>
                <span className="text-arion-text-muted text-xs italic">{stat.suffix}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-arion-card border border-arion-border p-6 rounded-sm h-[420px] relative overflow-hidden">
          {/* Subtle grid background for the card itself */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--arion-primary) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div>
              <h3 className="text-lg font-serif italic tracking-wide">Focus Intensity</h3>
              <p className="text-[9px] text-arion-text-muted uppercase tracking-widest font-bold mt-1">Real-time behavioral stream</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-arion-text-muted">
                <div className="w-2 h-2 rounded-full bg-arion-primary shadow-[0_0_8px_rgba(196,164,132,0.5)]" />
                Flow
              </div>
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-arion-text-muted">
                <div className="w-2 h-2 rounded-full border border-red-500/50 bg-red-500/10" />
                Interference
              </div>
            </div>
          </div>
          
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--arion-primary)" stopOpacity={0.4}/>
                    <stop offset="60%" stopColor="var(--arion-primary)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="var(--arion-primary)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDistractions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--arion-border)" opacity={0.5} />
                <XAxis 
                  dataKey="time" 
                  stroke="var(--arion-text-muted)" 
                  fontSize={9} 
                  tickLine={false} 
                  axisLine={false}
                  dy={10}
                  interval={chartData.length > 20 ? 4 : 2}
                />
                <YAxis 
                  stroke="var(--arion-text-muted)" 
                  fontSize={9} 
                  tickLine={false} 
                  axisLine={false}
                  domain={[0, 100]}
                  ticks={[0, 50, 100]}
                />
                <Tooltip content={<CustomChartTooltip />} cursor={{ stroke: 'var(--arion-primary)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                
                <Area 
                  type="monotone" 
                  dataKey="focus" 
                  stroke="var(--arion-primary)" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorFocus)"
                  animationDuration={1500}
                />
                <Area 
                  type="monotone" 
                  dataKey="distractions" 
                  stroke="#ef4444" 
                  strokeWidth={1.5}
                  fillOpacity={1} 
                  fill="url(#colorDistractions)"
                  strokeDasharray="5 5"
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 flex items-center justify-between border-t border-arion-border/50 pt-4 relative z-10">
            <div className="flex gap-4">
              <div className="space-y-1">
                <p className="text-[8px] text-arion-text-muted uppercase font-black tracking-widest">Stability</p>
                <p className="text-xs font-serif italic text-emerald-500">Nominal</p>
              </div>
              <div className="space-y-1 border-l border-arion-border/50 pl-4">
                <p className="text-[8px] text-arion-text-muted uppercase font-black tracking-widest">Peak Intensity</p>
                <p className="text-xs font-serif italic text-arion-primary">{peakIntensity}%</p>
              </div>
            </div>
            <button className="text-[9px] text-arion-primary uppercase font-bold tracking-[0.2em] hover:opacity-80 transition-opacity">
              View Insights →
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-arion-card border border-arion-border p-6 rounded-sm flex flex-col">
          <h3 className="text-lg font-serif italic tracking-wide mb-6">Distribution</h3>
          <div className="flex-1 flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: '#121212', border: '1px solid #262626', borderRadius: '4px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full mt-6 space-y-3">
              {categoryData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-arion-text-muted text-xs uppercase tracking-widest">{item.name}</span>
                  </div>
                  <span className="font-serif text-arion-primary">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-arion-card border border-arion-border p-6 rounded-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className={cn("p-2 rounded-lg", currentMetrics.dopamineLoopDetected ? "bg-red-500/10" : "bg-arion-primary/10")}>
              <Monitor className={cn("w-5 h-5", currentMetrics.dopamineLoopDetected ? "text-red-500" : "text-arion-primary")} />
            </div>
            <div>
              <h3 className="font-semibold">{currentMetrics.dopamineLoopDetected ? "Dopamine Loop Detected" : "Healthy Pattern"}</h3>
              <p className="text-xs text-zinc-500">Real-time behavior analysis</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-arion-bg border border-arion-border rounded-sm flex items-start gap-3">
              <MousePointer2 className="w-4 h-4 text-zinc-400 mt-1" />
              <div>
                <p className="text-sm font-medium">Tab Flow Analysis</p>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                  {currentMetrics.dopamineLoopDetected 
                    ? `You've switched tabs frequently in the last few minutes. This pattern often indicates high stimulation seeking.`
                    : "Your browsing behavior is focused and intentional. Keep up the high-quality flow."}
                </p>
              </div>
            </div>
            {currentMetrics.dopamineLoopDetected && (
              <button className="w-full py-2 bg-red-500/10 text-red-500 text-xs font-semibold rounded-lg hover:bg-red-500/20 transition-colors">
                Force Deep Work Session
              </button>
            )}
          </div>
        </div>

        <div className="bg-arion-card border border-arion-border p-6 rounded-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-arion-primary/10 rounded-lg">
              <Brain className="w-5 h-5 text-arion-primary" />
            </div>
            <div>
              <h3 className="font-serif italic tracking-wide">AI Focus Score</h3>
              <p className="text-xs text-zinc-500">Pulse Intelligence metrics</p>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle 
                  cx="48" cy="48" r="40" 
                  fill="transparent" 
                  stroke="currentColor" 
                  strokeWidth="8" 
                  className="text-arion-border"
                />
                <circle 
                  cx="48" cy="48" r="40" 
                  fill="transparent" 
                  stroke="currentColor" 
                  strokeWidth="8" 
                  strokeDasharray={2 * Math.PI * 40}
                  strokeDashoffset={2 * Math.PI * 40 * (1 - currentScore / 100)}
                  className="text-arion-primary"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-serif text-arion-primary">{currentScore}</span>
                <span className="text-[10px] text-arion-text-muted uppercase font-bold tracking-widest">Score</span>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <div className="text-[10px] uppercase tracking-widest font-bold">
                <span className="text-arion-text-muted">Stability:</span>
                <span className={cn("ml-2", currentScore > 70 ? "text-arion-primary" : "text-amber-500")}>
                  {currentScore > 90 ? 'Perfect' : currentScore > 70 ? 'Strong' : 'Fragile'}
                </span>
              </div>
              <div className="text-[10px] uppercase tracking-widest font-bold">
                <span className="text-arion-text-muted">Context Switches:</span>
                <span className={cn("ml-2", currentMetrics.tabSwitchFrequency > 5 ? "text-red-400" : "text-arion-primary")}>
                  {currentMetrics.tabSwitchFrequency > 10 ? 'Critical' : currentMetrics.tabSwitchFrequency > 5 ? 'High' : 'Low'}
                </span>
              </div>
              <div className="text-[10px] uppercase tracking-widest font-bold">
                <span className="text-arion-text-muted">Stamina Index:</span>
                <span className="ml-2 text-arion-primary">Stable</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
