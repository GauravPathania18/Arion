import React, { useState } from 'react';
import { 
  Lock, 
  EyeOff, 
  MapPin, 
  Calendar,
  Plus,
  Trash2,
  Moon,
  Sun,
  ShieldCheck
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Settings() {
  const [incognitoEnabled, setIncognitoEnabled] = useState(true);
  const [schedules, setSchedules] = useState([
    { id: 1, start: '23:00', end: '09:00', name: 'Sleep Cycle' },
    { id: 2, start: '13:00', end: '15:00', name: 'Deep Work' },
  ]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-serif italic tracking-tighter mb-2 text-aura-primary">App Settings</h2>
        <p className="text-aura-text-muted text-sm uppercase tracking-widest font-bold">Manage your focus and privacy.</p>
      </div>

      {/* Notion Integration */}
      <section className="bg-aura-card border border-aura-border rounded-sm overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-aura-border bg-aura-bg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 border border-aura-primary/20 bg-aura-primary/5 rounded-sm">
              <Plus className="w-5 h-5 text-aura-primary" />
            </div>
            <div>
              <h3 className="font-serif italic tracking-wide">Notion Integration</h3>
              <p className="text-[10px] text-aura-text-muted uppercase tracking-tight">Automated Weekly Retrospectives</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest text-aura-text-muted ml-1">API Token</label>
              <input 
                type="password" 
                placeholder="secret_..." 
                className="w-full bg-aura-bg border border-aura-border rounded-sm px-4 py-3 text-xs focus:outline-none focus:border-aura-primary transition-colors text-aura-text-bright"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest text-aura-text-muted ml-1">Notion Database ID</label>
              <input 
                type="text" 
                placeholder="0281..." 
                className="w-full bg-aura-bg border border-aura-border rounded-sm px-4 py-3 text-xs focus:outline-none focus:border-aura-primary transition-colors text-aura-text-bright"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-aura-primary/5 border border-aura-primary/10 rounded-sm">
            <ShieldCheck className="w-4 h-4 text-aura-primary" />
            <p className="text-[10px] text-aura-text-muted italic">API tokens are stored in your encrypted local Chrome storage.</p>
          </div>
        </div>
      </section>

      {/* Incognito Restrictions */}
      <section className="bg-aura-card border border-aura-border rounded-sm overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-aura-border bg-aura-bg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 border border-red-500/20 bg-red-500/5 rounded-sm">
              <EyeOff className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="font-serif italic tracking-wide">Incognito blocker</h3>
              <p className="text-[10px] text-aura-text-muted uppercase tracking-tight">Stops private browsing when you should be working or sleeping</p>
            </div>
          </div>
          <button 
            onClick={() => setIncognitoEnabled(!incognitoEnabled)}
            className={cn(
              "w-10 h-5 rounded-full p-0.5 transition-colors relative",
              incognitoEnabled ? "bg-red-500" : "bg-aura-border"
            )}
          >
            <div className={cn(
              "w-4 h-4 bg-aura-bg rounded-full transition-transform",
              incognitoEnabled ? "translate-x-5" : "translate-x-0"
            )} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-300">Active Schedules</label>
            <button className="flex items-center gap-2 text-xs text-aura-primary font-semibold hover:opacity-80 transition-opacity">
              <Plus className="w-3 h-3" />
              Add Schedule
            </button>
          </div>

          <div className="space-y-3">
            {schedules.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-4 bg-aura-bg rounded-sm border border-aura-border group">
                <div className="flex items-center gap-4">
                  <div className="p-2 border border-aura-border bg-aura-card rounded-sm text-aura-text-muted group-hover:text-aura-primary transition-colors">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest">{s.name}</p>
                    <p className="text-[11px] text-aura-primary font-mono italic">{s.start} — {s.end}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] px-2 py-0.5 bg-red-500/10 text-red-500 rounded font-bold uppercase tracking-wider">Restricted</span>
                  <button className="text-zinc-600 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl flex gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-xs text-zinc-400 leading-relaxed">
              <span className="text-amber-500 font-bold">Strict Mode:</span> Timezone changes are automatically detected. Any inconsistency between system and browser time will result in a global restriction until verified.
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-aura-card border border-aura-border p-6 rounded-sm shadow-xl">
          <h3 className="font-serif italic tracking-wide mb-6">Blocked Sites</h3>
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Add domain..." 
              className="w-full bg-aura-bg border border-aura-border rounded-sm px-4 py-3 text-xs placeholder:italic focus:outline-none focus:border-aura-primary transition-colors"
            />
            <div className="space-y-2">
              {['facebook.com', 'reddit.com', 'youtube.com'].map(site => (
                <div key={site} className="flex items-center justify-between p-2 hover:bg-zinc-900 rounded-md text-xs group">
                  <span>{site}</span>
                  <button className="text-zinc-600 opacity-0 group-hover:opacity-100">Remove</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-aura-card border border-aura-border p-6 rounded-sm shadow-xl">
          <h3 className="font-serif italic tracking-wide mb-6">Appearance</h3>
          <div className="space-y-4">
             <div className="flex items-center justify-between p-4 bg-aura-bg border border-aura-border rounded-sm opacity-50">
                <div className="flex items-center gap-4 text-aura-text-muted">
                  <Moon className="w-4 h-4" />
                  <span className="text-[10px] uppercase font-bold tracking-widest">Dark Mode (Default)</span>
                </div>
                <div className="w-3 h-3 rounded-full bg-aura-primary" />
             </div>
             <div className="flex items-center justify-between p-4 bg-aura-bg border border-aura-border rounded-sm opacity-30">
                <div className="flex items-center gap-4 text-aura-text-muted">
                  <Sun className="w-4 h-4" />
                  <span className="text-[10px] uppercase font-bold tracking-widest">Light Mode</span>
                </div>
                <div className="w-3 h-3 rounded-full border border-aura-border" />
             </div>
          </div>
        </div>
      </section>
    </div>
  );
}
