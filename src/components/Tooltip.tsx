import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
}

export default function Tooltip({ content, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children ? children : (
        <HelpCircle className="w-3 h-3 text-arion-text-muted hover:text-arion-primary transition-colors cursor-help" />
      )}
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-[100] bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-arion-bg border border-arion-border shadow-2xl rounded-sm pointer-events-none"
          >
            <p className="text-[10px] text-arion-text-bright leading-relaxed text-center font-medium italic">
              {content}
            </p>
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-2 h-2 border-r border-b border-arion-border bg-arion-bg rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
