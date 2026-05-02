import React, { useState } from 'react';
import { 
  Sparkles, 
  ExternalLink,
  Plus,
  RefreshCw, 
  BrainCircuit, 
  Calendar,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'motion/react';
import { generateProductivityInsights } from '../services/geminiService';
import { cn } from '../lib/utils';

export default function Insights() {
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);

  const mockData = {
    date: '2026-05-02',
    totalActiveTime: 28800,
    focusScore: 82,
    sites: []
  };

  const mockMetrics = {
    tabSwitchFrequency: 8.5,
    dopamineLoopDetected: true,
    procrastinationScore: 35
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateProductivityInsights([mockData], mockMetrics);
      setInsight(result);
    } catch (e) {
      setInsight("Error generating insights.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif italic tracking-tighter text-aura-primary flex items-center gap-3">
             AI Performance Coach 
          </h2>
          <p className="text-aura-text-muted text-xs uppercase tracking-widest font-bold">AI analyzing how you use your computer.</p>
        </div>
        <button 
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center gap-2 px-8 py-3 bg-aura-primary text-aura-bg font-bold rounded-sm hover:scale-105 shadow-2xl transition-all disabled:opacity-50 disabled:scale-100"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? 'Analyzing...' : 'Generate Insights'}
        </button>
      </div>

      {!insight && !loading && (
        <div className="bg-aura-card border border-aura-border p-12 rounded-sm flex flex-col items-center text-center shadow-2xl">
          <div className="p-4 bg-aura-bg border border-aura-border rounded-sm mb-6">
            <BrainCircuit className="w-12 h-12 text-aura-primary" />
          </div>
          <h3 className="text-xl font-serif italic mb-2">Ready for Analysis</h3>
          <p className="text-aura-text-muted text-xs italic max-w-sm mb-8">
            AI helps you find focus and stop wasting time. 
          </p>
          <div className="grid grid-cols-2 gap-4 w-full max-w-md">
            <div className="p-4 bg-aura-bg border border-aura-border rounded-sm text-left">
              <CheckCircle2 className="w-4 h-4 text-aura-primary mb-2" />
              <p className="text-[10px] font-bold uppercase tracking-widest">Privacy First</p>
              <p className="text-[10px] text-aura-text-muted mt-1 leading-relaxed">Data is processed anonymously and stored locally.</p>
            </div>
            <div className="p-4 bg-aura-bg border border-aura-border rounded-sm text-left">
              <Calendar className="w-4 h-4 text-aura-primary mb-2" />
              <p className="text-[10px] font-bold uppercase tracking-widest">Trend Analysis</p>
              <p className="text-[10px] text-aura-text-muted mt-1 leading-relaxed">Learns from your last 7 days of behavior.</p>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          <div className="h-[200px] bg-aura-card border border-zinc-800 rounded-3xl animate-pulse flex items-center justify-center">
            <p className="text-zinc-500 text-sm italic">Looking for distractions...</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="h-40 bg-aura-card border border-zinc-800 rounded-3xl animate-pulse" />
             <div className="h-40 bg-aura-card border border-zinc-800 rounded-3xl animate-pulse" />
          </div>
        </div>
      )}

      {insight && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-aura-card border-l-4 border-l-aura-primary border-t border-r border-b border-aura-border p-8 rounded-sm shadow-2xl"
        >
          <div className="prose prose-invert prose-emerald max-w-none prose-sm font-serif italic text-lg leading-relaxed">
            <ReactMarkdown>{insight}</ReactMarkdown>
          </div>
          
          <div className="mt-12 pt-8 border-t border-aura-border flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 border border-aura-primary/20 bg-aura-primary/5 rounded-sm">
                <AlertCircle className="w-5 h-5 text-aura-primary" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-aura-text-bright">Next Step</p>
                <p className="text-[11px] text-aura-text-muted italic">Use this plan to stay focused tomorrow.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-6 py-2 bg-aura-bg border border-aura-border rounded-sm text-[10px] uppercase font-bold tracking-widest hover:border-aura-primary/50 transition-colors">
                <ExternalLink className="w-3 h-3" />
                Export to Notion
              </button>
              <button className="px-6 py-2 bg-aura-primary text-aura-bg border border-aura-primary rounded-sm text-[10px] uppercase font-bold tracking-widest hover:scale-105 transition-all">
                Save My Plan
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
