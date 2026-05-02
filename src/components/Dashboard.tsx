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
import { calculateFocusScore } from '../services/behavioralEngine';
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

  const currentScore = useMemo(() => calculateFocusScore(
    310, // In a real app, this would be computed from siteUsage
    45,  
    activeSession ? [activeSession] : [],
    currentMetrics,
    engagements
  ), [currentMetrics, engagements, activeSession]);

  const categoryData = useMemo(() => {
    if (siteUsage.length === 0) {
      return [
        { name: 'Productive', value: 65, color: '#C4A484' },
        { name: 'Distracting', value: 25, color: '#ef4444' },
        { name: 'Neutral', value: 10, color: '#3f3f46' },
      ];
    }

    // Map site categories (simulated categorization)
    const productiveSites = ['github.com', 'stackoverflow.com', 'notion.so', 'figma.com'];
    const distractingSites = ['twitter.com', 'youtube.com', 'facebook.com', 'reddit.com', 'instagram.com'];

    let productiveTime = 0;
    let distractingTime = 0;
    let neutralTime = 0;

    siteUsage.forEach(site => {
      if (productiveSites.includes(site.domain)) productiveTime += site.timeSpent;
      else if (distractingSites.includes(site.domain)) distractingTime += site.timeSpent;
      else neutralTime += site.timeSpent;
    });

    const total = productiveTime + distractingTime + neutralTime;
    return [
      { name: 'Productive', value: Math.round((productiveTime / total) * 100) || 0, color: '#C4A484' },
      { name: 'Distracting', value: Math.round((distractingTime / total) * 100) || 0, color: '#ef4444' },
      { name: 'Neutral', value: Math.round((neutralTime / total) * 100) || 0, color: '#3f3f46' },
    ];
  }, [siteUsage]);

  // Transform real history to chart format if needed, or use default
  const chartData = useMemo(() => {
    if (history.length === 0) return defaultHistory;
    return history.map(day => ({
      time: day.date,
      focus: day.focusScore,
      distractions: 100 - day.focusScore // Approximation for chart
    }));
  }, [history]);

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
            className="bg-aura-card border border-aura-border p-6 rounded-sm shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-aura-card border border-aura-border rounded-sm">
                <stat.icon className="w-4 h-4 text-aura-primary" />
              </div>
              {stat.trend && (
                <div className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                  stat.trendUp === true ? "border-emerald-500/20 text-emerald-500 bg-emerald-500/5" : 
                  stat.trendUp === false ? "border-red-500/20 text-red-500 bg-red-500/5" : "border-aura-border text-aura-text-muted"
                )}>
                  {stat.trend}
                </div>
              )}
            </div>
            <div>
              <p className="text-aura-text-muted text-[10px] uppercase tracking-widest mb-1">{stat.label}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-serif text-aura-primary">{stat.value}</span>
                <span className="text-aura-text-muted text-xs italic">{stat.suffix}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-aura-card border border-aura-border p-6 rounded-sm h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-serif italic tracking-wide">Focus Intensity</h3>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-aura-text-muted">
                <div className="w-1.5 h-1.5 rounded-full bg-aura-primary" />
                Focus
              </div>
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-aura-text-muted">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
                Distractions
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C4A484" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#C4A484" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
              <XAxis 
                dataKey="time" 
                stroke="#888888" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis 
                stroke="#888888" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                domain={[0, 100]}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#121212', border: '1px solid #262626', borderRadius: '4px' }}
                itemStyle={{ color: '#E5E5E5', fontSize: '12px' }}
              />
              <Area 
                type="monotone" 
                dataKey="focus" 
                stroke="#C4A484" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorFocus)" 
              />
              <Area 
                type="monotone" 
                dataKey="distractions" 
                stroke="#ef4444" 
                strokeWidth={2}
                fill="transparent"
                strokeDasharray="4 4"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Categories */}
        <div className="bg-aura-card border border-aura-border p-6 rounded-sm flex flex-col">
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
                    <span className="text-aura-text-muted text-xs uppercase tracking-widest">{item.name}</span>
                  </div>
                  <span className="font-serif text-aura-primary">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-aura-card border border-aura-border p-6 rounded-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className={cn("p-2 rounded-lg", currentMetrics.dopamineLoopDetected ? "bg-red-500/10" : "bg-aura-primary/10")}>
              <Monitor className={cn("w-5 h-5", currentMetrics.dopamineLoopDetected ? "text-red-500" : "text-aura-primary")} />
            </div>
            <div>
              <h3 className="font-semibold">{currentMetrics.dopamineLoopDetected ? "Dopamine Loop Detected" : "Healthy Pattern"}</h3>
              <p className="text-xs text-zinc-500">Real-time behavior analysis</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-aura-bg border border-aura-border rounded-sm flex items-start gap-3">
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

        <div className="bg-aura-card border border-aura-border p-6 rounded-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-aura-primary/10 rounded-lg">
              <Brain className="w-5 h-5 text-aura-primary" />
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
                  className="text-aura-border"
                />
                <circle 
                  cx="48" cy="48" r="40" 
                  fill="transparent" 
                  stroke="currentColor" 
                  strokeWidth="8" 
                  strokeDasharray={2 * Math.PI * 40}
                  strokeDashoffset={2 * Math.PI * 40 * (1 - currentScore / 100)}
                  className="text-aura-primary"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-serif text-aura-primary">{currentScore}</span>
                <span className="text-[10px] text-aura-text-muted uppercase font-bold tracking-widest">Score</span>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <div className="text-[10px] uppercase tracking-widest font-bold">
                <span className="text-aura-text-muted">Stability:</span>
                <span className={cn("ml-2", currentScore > 70 ? "text-aura-primary" : "text-amber-500")}>
                  {currentScore > 90 ? 'Perfect' : currentScore > 70 ? 'Strong' : 'Fragile'}
                </span>
              </div>
              <div className="text-[10px] uppercase tracking-widest font-bold">
                <span className="text-aura-text-muted">Context Switches:</span>
                <span className={cn("ml-2", currentMetrics.tabSwitchFrequency > 5 ? "text-red-400" : "text-aura-primary")}>
                  {currentMetrics.tabSwitchFrequency > 10 ? 'Critical' : currentMetrics.tabSwitchFrequency > 5 ? 'High' : 'Low'}
                </span>
              </div>
              <div className="text-[10px] uppercase tracking-widest font-bold">
                <span className="text-aura-text-muted">Stamina Index:</span>
                <span className="ml-2 text-aura-primary">Stable</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
