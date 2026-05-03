import React, { useState } from 'react';
import { 
  FileCode, 
  Copy, 
  Check, 
  Terminal, 
  ExternalLink,
  ChevronRight,
  ShieldIcon
} from 'lucide-react';
import { cn } from '../lib/utils';

const codeFiles = [
  {
    name: 'manifest.json',
    lang: 'json',
    code: `{
  "manifest_version": 3,
  "name": "Arion Focus AI",
  "version": "1.0.0",
  "description": "AI-powered productivity system.",
  "permissions": [
    "storage",
    "tabs",
    "notifications",
    "alarms",
    "browsingData",
    "scripting"
  ],
  "host_permissions": [
    "<all_urls>"
  ],
  "background": {
    "service_worker": "background.js"
  ],
  "action": {
    "default_popup": "popup.html"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"]
    }
  ]
}`
  },
  {
    name: 'background.js',
    lang: 'javascript',
    code: `// --- Incognito Blocking Engine ---
chrome.tabs.onCreated.addListener((tab) => {
  const now = new Date();
  const hour = now.getHours();
  // Example restricted range: 11 PM to 9 AM
  const isRestrictedTime = hour >= 23 || hour < 9;

  if (tab.incognito && isRestrictedTime) {
    chrome.tabs.remove(tab.id);
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon.png',
      title: 'Incognito Restricted',
      message: 'Private sessions are disabled during the night for your focus.'
    });
  }
});

// --- Active Usage Tracker ---
let usageData = {};
chrome.tabs.onActivated.addListener(activeInfo => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url) trackSite(new URL(tab.url).hostname);
  });
});

async function trackSite(domain) {
  const stats = await chrome.storage.local.get('usage');
  // Logic to update time spent per domain...
}

// --- Behavioral Loop Detector ---
let lastSwitches = [];
function detectLoops() {
  const now = Date.now();
  lastSwitches = lastSwitches.filter(t => now - t < 60000);
  if (lastSwitches.length > 10) {
    chrome.action.setBadgeText({ text: 'LOOP' });
    chrome.action.setBadgeBackgroundColor({ color: '#F59E0B' });
  }
}`
  },
  {
    name: 'content.js',
    lang: 'javascript',
    code: `// --- Focus Mode & Site Degradation ---
const BLOCKED_SITES = ['twitter.com', 'facebook.com', 'reddit.com'];
const DEGRADE_ONLY = true; // Toggle for visual degradation vs hard block

function applyFocusProtocol() {
  const host = window.location.hostname;
  const isTarget = BLOCKED_SITES.some(site => host.includes(site));
  
  if (isTarget) {
    if (DEGRADE_ONLY) {
      applyDegradation();
    } else {
      showBlockerOverlay();
    }
  }
}

function applyDegradation() {
  const style = document.createElement('style');
  style.innerHTML = \`
    html { 
      filter: grayscale(100%) brightness(0.9) !important; 
    }
    img, video, canvas { 
      visibility: hidden !important; 
      opacity: 0 !important;
    }
    * {
      transition: none !important;
      animation: none !important;
    }
    body::before {
      content: "ARION: GRAY MODE ACTIVE";
      position: fixed;
      top: 0; left: 0; right: 0;
      background: #C4A484;
      color: #050505;
      font-size: 10px;
      font-weight: bold;
      text-align: center;
      padding: 4px;
      z-index: 999999;
      letter-spacing: 2px;
    }
  \`;
  document.head.appendChild(style);
}

function showBlockerOverlay() {
  document.body.innerHTML = \`
    <div style="background:#050505; height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#E5E5E5; font-family:serif; font-style:italic;">
       <h1 style="font-size:3rem; margin-bottom:1rem; color:#C4A484;">Focus Mode On</h1>
       <p style="color:#888; font-family:sans-serif; font-style:normal; font-size:12px; letter-spacing:2px; text-transform:uppercase;">This site is blocked for \${window.location.hostname}.</p>
    </div>
  \`;
}

applyFocusProtocol();`
  }
];

export default function ExtensionCode() {
  const [selectedFile, setSelectedFile] = useState(codeFiles[0]);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-[600px]">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-serif italic tracking-tighter text-arion-primary mb-2">Extension Code</h2>
          <p className="text-arion-text-muted text-[10px] uppercase font-bold tracking-widest mt-4">
            Code for your browser extension.
          </p>
        </div>

        <div className="space-y-2">
          {codeFiles.map((file) => (
            <button
              key={file.name}
              onClick={() => setSelectedFile(file)}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-sm border transition-all",
                selectedFile.name === file.name 
                  ? "bg-arion-primary/5 border-arion-primary text-arion-primary" 
                  : "bg-arion-bg border-arion-border text-arion-text-muted hover:border-arion-text-bright"
              )}
            >
              <div className="flex items-center gap-3">
                <FileCode className="w-4 h-4" />
                <span className="text-sm font-semibold">{file.name}</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
          ))}
        </div>

        <div className="p-6 bg-arion-card rounded-sm border border-arion-border">
           <div className="flex items-center gap-3 mb-4">
              <ShieldIcon className="w-5 h-5 text-arion-primary" />
              <h3 className="font-serif italic text-white">Privacy Guard</h3>
           </div>
           <p className="text-[10px] text-arion-text-muted leading-relaxed uppercase tracking-widest font-bold mb-3">Manifest V3 Strict</p>
           <p className="text-[11px] text-arion-text-muted leading-relaxed italic">
             Arion uses the <code className="text-arion-primary font-mono not-italic">declarativeNetRequest</code> API 
             to block sites without intercepting your actual content.
           </p>
        </div>
      </div>

      <div className="lg:col-span-2 flex flex-col bg-arion-card border border-arion-border rounded-sm overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-arion-primary/50 shadow-[0_0_15px_rgba(196,164,132,0.3)]" />
        <div className="flex items-center justify-between px-6 py-4 border-b border-arion-border bg-arion-bg">
          <div className="flex items-center gap-4">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/30" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/30" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/30" />
            </div>
            <div className="h-4 w-px bg-arion-border/50 mx-1" />
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-arion-text-muted" />
              <span className="text-[10px] uppercase font-black tracking-[0.2em] text-arion-text-muted">{selectedFile.name}</span>
            </div>
          </div>
          <button 
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-arion-primary/10 border border-arion-primary/30 hover:bg-arion-primary/20 transition-all text-[9px] tracking-[0.2em] font-black text-arion-primary uppercase rounded-sm"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Captured' : 'Copy Source'}
          </button>
        </div>
        <div className="flex-1 p-8 font-mono text-xs overflow-auto bg-[#080808] selection:bg-arion-primary/30 selection:text-white">
          <pre className="text-zinc-400 leading-loose">
            {selectedFile.code.split('\n').map((line, i) => (
              <div key={i} className="flex gap-6 group">
                <span className="w-8 text-right text-zinc-700 select-none group-hover:text-zinc-500 transition-colors uppercase font-mono text-[9px] pt-0.5">{(i + 1).toString().padStart(2, '0')}</span>
                <span className={cn(
                  "flex-1",
                  line.trim().startsWith('//') ? "text-zinc-600 italic" : 
                  line.includes('"') || line.includes("'") ? "text-arion-primary/90" :
                  line.match(/\b(function|async|await|const|let|return|if|else|addListener)\b/) ? "text-white font-bold" : "text-zinc-400"
                )}>{line}</span>
              </div>
            ))}
          </pre>
        </div>
        
        <div className="px-6 py-3 border-t border-arion-border bg-arion-bg flex justify-between items-center">
          <div className="flex items-center gap-4 text-[9px] text-arion-text-muted uppercase font-bold tracking-widest">
            <span className="flex items-center gap-1.5 font-mono">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              UTF-8
            </span>
            <span className="font-mono">Ln {selectedFile.code.split('\n').length}</span>
          </div>
          <p className="text-[9px] text-arion-text-muted italic">Ready for sideloading.</p>
        </div>
      </div>
    </div>
  );
}
