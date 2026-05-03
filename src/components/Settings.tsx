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
  ShieldCheck,
  HelpCircle,
  Timer
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useTheme } from '../ThemeContext';
import Tooltip from './Tooltip';
import { useProductivity } from '../ProductivityContext';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { settings, updateSettings } = useProductivity();
  const [newSite, setNewSite] = useState('');

  const [schedules] = useState([
    { id: 1, start: '23:00', end: '09:00', name: 'Sleep Cycle' },
    { id: 2, start: '13:00', end: '15:00', name: 'Deep Work' },
  ]);

  const handleAddSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSite) return;
    const cleanSite = newSite.trim().toLowerCase();
    if (settings.blockedSites.includes(cleanSite)) return;
    updateSettings({ blockedSites: [...settings.blockedSites, cleanSite] });
    setNewSite('');
  };

  const handleRemoveSite = (site: string) => {
    updateSettings({ blockedSites: settings.blockedSites.filter(s => s !== site) });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-serif italic tracking-tighter mb-2 text-arion-primary">App Settings</h2>
        <p className="text-arion-text-muted text-sm uppercase tracking-widest font-bold">Manage your focus and privacy.</p>
      </div>

      {/* Focus Mode Configuration */}
      <section className="bg-arion-card border border-arion-border rounded-sm overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-arion-border bg-arion-bg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 border border-arion-primary/20 bg-arion-primary/5 rounded-sm">
              <Timer className="w-5 h-5 text-arion-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif italic tracking-wide">Focus Mode Configuration</h3>
                <Tooltip content="Fine-tune your deep work sessions and site restrictions." />
              </div>
              <p className="text-[10px] text-arion-text-muted uppercase tracking-tight">Session parameters & guardrails</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-widest text-arion-text-bright">Default Session Duration</label>
                <p className="text-[10px] text-arion-text-muted italic">Recommended: 25-45 minutes for peak neuroplasticity.</p>
              </div>
              <span className="text-xl font-serif italic text-arion-primary">{settings.defaultSessionDuration}m</span>
            </div>
            <input 
              type="range" 
              min="5" 
              max="120" 
              step="5"
              value={settings.defaultSessionDuration}
              onChange={(e) => updateSettings({ defaultSessionDuration: parseInt(e.target.value) })}
              className="w-full accent-arion-primary cursor-pointer"
            />
          </div>

          <div className="pt-4 border-t border-arion-border">
            <div className="flex items-center gap-2 mb-4">
              <h4 className="text-[10px] uppercase font-bold tracking-widest text-arion-text-muted">Restricted Domains</h4>
              <Tooltip content="Sites added here will trigger block screens during active sessions." />
            </div>
            
            <form onSubmit={handleAddSite} className="flex gap-2 mb-4">
              <input 
                type="text" 
                value={newSite}
                onChange={(e) => setNewSite(e.target.value)}
                placeholder="e.g. twitter.com" 
                className="flex-1 bg-arion-bg border border-arion-border rounded-sm px-4 py-3 text-xs placeholder:italic focus:outline-none focus:border-arion-primary transition-colors text-arion-text-bright"
              />
              <button 
                type="submit"
                className="px-6 bg-arion-primary text-arion-bg font-bold uppercase tracking-widest text-[9px] rounded-sm hover:opacity-90 transition-opacity"
              >
                Add Site
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {settings.blockedSites.map(site => (
                <div key={site} className="flex items-center justify-between p-3 bg-arion-bg/50 border border-arion-border rounded-sm group hover:border-arion-primary/30 transition-colors">
                  <span className="text-[10px] font-mono text-zinc-400">{site}</span>
                  <button 
                    onClick={() => handleRemoveSite(site)}
                    className="text-zinc-600 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Notion Integration */}
      <section className="bg-arion-card border border-arion-border rounded-sm overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-arion-border bg-arion-bg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 border border-arion-primary/20 bg-arion-primary/5 rounded-sm">
              <Plus className="w-5 h-5 text-arion-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif italic tracking-wide">Notion Integration</h3>
                <Tooltip content="Sync your focus data to Notion for automated weekly productivity journals." />
              </div>
              <p className="text-[10px] text-arion-text-muted uppercase tracking-tight">Automated Weekly Retrospectives</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 ml-1">
                <label className="text-[10px] uppercase font-bold tracking-widest text-arion-text-muted">API Token</label>
                <Tooltip content="Your Notion Internal Integration Token. Found in Notion Settings -> Connections." />
              </div>
              <input 
                type="password" 
                value={settings.notionToken || ''}
                onChange={(e) => updateSettings({ notionToken: e.target.value })}
                placeholder="secret_..." 
                className="w-full bg-arion-bg border border-arion-border rounded-sm px-4 py-3 text-xs focus:outline-none focus:border-arion-primary transition-colors text-arion-text-bright"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 ml-1">
                <label className="text-[10px] uppercase font-bold tracking-widest text-arion-text-muted">Notion Database ID</label>
                <Tooltip content="The unique ID of the Notion database where metrics will be saved." />
              </div>
              <input 
                type="text" 
                value={settings.notionDatabaseId || ''}
                onChange={(e) => updateSettings({ notionDatabaseId: e.target.value })}
                placeholder="0281..." 
                className="w-full bg-arion-bg border border-arion-border rounded-sm px-4 py-3 text-xs focus:outline-none focus:border-arion-primary transition-colors text-arion-text-bright"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-arion-primary/5 border border-arion-primary/10 rounded-sm">
            <ShieldCheck className="w-4 h-4 text-arion-primary" />
            <p className="text-[10px] text-arion-text-muted italic">API tokens are stored in your encrypted cloud profile.</p>
          </div>
        </div>
      </section>

      {/* Incognito Restrictions */}
      <section className="bg-arion-card border border-arion-border rounded-sm overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-arion-border bg-arion-bg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 border border-red-500/20 bg-red-500/5 rounded-sm">
              <EyeOff className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif italic tracking-wide">Incognito blocker</h3>
                <Tooltip content="Disables Incognito mode during focus hours to prevent bypassing site blocks." />
              </div>
              <p className="text-[10px] text-arion-text-muted uppercase tracking-tight">Stops private browsing when you should be working or sleeping</p>
            </div>
          </div>
          <button 
            onClick={() => updateSettings({ incognitoBlocker: !settings.incognitoBlocker })}
            className={cn(
              "w-10 h-5 rounded-full p-0.5 transition-colors relative",
              settings.incognitoBlocker ? "bg-red-500" : "bg-arion-border"
            )}
          >
            <div className={cn(
              "w-4 h-4 bg-arion-bg rounded-full transition-transform",
              settings.incognitoBlocker ? "translate-x-5" : "translate-x-0"
            )} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-300">Active Schedules</label>
            <button className="flex items-center gap-2 text-xs text-arion-primary font-semibold hover:opacity-80 transition-opacity">
              <Plus className="w-3 h-3" />
              Add Schedule
            </button>
          </div>

          <div className="space-y-3">
            {schedules.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-4 bg-arion-bg rounded-sm border border-arion-border group">
                <div className="flex items-center gap-4">
                  <div className="p-2 border border-arion-border bg-arion-card rounded-sm text-arion-text-muted group-hover:text-arion-primary transition-colors">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest">{s.name}</p>
                    <p className="text-[11px] text-arion-primary font-mono italic">{s.start} — {s.end}</p>
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
        <div className="bg-arion-card border border-arion-border p-6 rounded-sm shadow-xl">
          <div className="flex items-center gap-2 mb-6">
            <h3 className="font-serif italic tracking-wide">Blocked Sites</h3>
            <Tooltip content="Sites added here will be completely inaccessible during active focus sessions." />
          </div>
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Add domain..." 
              className="w-full bg-arion-bg border border-arion-border rounded-sm px-4 py-3 text-xs placeholder:italic focus:outline-none focus:border-arion-primary transition-colors"
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

        <div className="bg-arion-card border border-arion-border p-6 rounded-sm shadow-xl">
          <div className="flex items-center gap-2 mb-6">
            <h3 className="font-serif italic tracking-wide">Appearance</h3>
            <Tooltip content="Switch between visual themes. Your choice is synced across devices." />
          </div>
          <div className="space-y-4">
             <button 
                onClick={() => setTheme('dark')}
                className={cn(
                  "w-full flex items-center justify-between p-4 bg-arion-bg border border-arion-border rounded-sm transition-all",
                  theme === 'dark' ? "opacity-100 border-arion-primary" : "opacity-50 hover:opacity-70"
                )}
              >
                <div className={cn("flex items-center gap-4", theme === 'dark' ? "text-arion-primary" : "text-arion-text-muted")}>
                  <Moon className="w-4 h-4" />
                  <span className="text-[10px] uppercase font-bold tracking-widest">Dark Mode</span>
                </div>
                {theme === 'dark' && <div className="w-3 h-3 rounded-full bg-arion-primary" />}
             </button>
             <button 
                onClick={() => setTheme('light')}
                className={cn(
                  "w-full flex items-center justify-between p-4 bg-arion-bg border border-arion-border rounded-sm transition-all",
                  theme === 'light' ? "opacity-100 border-arion-primary" : "opacity-50 hover:opacity-70"
                )}
              >
                <div className={cn("flex items-center gap-4", theme === 'light' ? "text-arion-primary" : "text-arion-text-muted")}>
                  <Sun className="w-4 h-4" />
                  <span className="text-[10px] uppercase font-bold tracking-widest">Light Mode</span>
                </div>
                {theme === 'light' && <div className="w-3 h-3 rounded-full bg-arion-primary" />}
             </button>
          </div>
        </div>
      </section>
    </div>
  );
}
