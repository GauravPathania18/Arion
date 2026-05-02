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
  "name": "Aura Focus AI",
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
      content: "AURA: GRAY MODE ACTIVE";
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
          <h2 className="text-2xl font-serif italic tracking-tighter text-aura-primary mb-2">Extension Code</h2>
          <p className="text-aura-text-muted text-[10px] uppercase font-bold tracking-widest mt-4">
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
                  ? "bg-aura-primary/5 border-aura-primary text-aura-primary" 
                  : "bg-aura-bg border-aura-border text-aura-text-muted hover:border-aura-text-bright"
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

        <div className="p-6 bg-aura-card rounded-sm border border-aura-border">
           <div className="flex items-center gap-3 mb-4">
              <ShieldIcon className="w-5 h-5 text-aura-primary" />
              <h3 className="font-serif italic text-white">Privacy Guard</h3>
           </div>
           <p className="text-[10px] text-aura-text-muted leading-relaxed uppercase tracking-widest font-bold mb-3">Manifest V3 Strict</p>
           <p className="text-[11px] text-aura-text-muted leading-relaxed italic">
             Aura uses the <code className="text-aura-primary font-mono not-italic">declarativeNetRequest</code> API 
             to block sites without intercepting your actual content.
           </p>
        </div>
      </div>

      <div className="lg:col-span-2 flex flex-col bg-aura-card border border-aura-border rounded-sm overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-aura-border bg-aura-bg">
          <div className="flex items-center gap-4">
            <Terminal className="w-4 h-4 text-aura-text-muted" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-aura-text-muted">{selectedFile.name}</span>
          </div>
          <button 
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 border border-aura-border bg-aura-card hover:bg-aura-bg transition-colors text-[10px] tracking-widest font-bold text-aura-primary uppercase"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy Code'}
          </button>
        </div>
        <div className="flex-1 p-6 font-mono text-sm overflow-auto bg-zinc-950/50">
          <pre className="text-zinc-400 leading-relaxed">
            {selectedFile.code}
          </pre>
        </div>
      </div>
    </div>
  );
}
