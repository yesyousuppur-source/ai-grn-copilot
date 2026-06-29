'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Package } from 'lucide-react';
import { usePWAInstall } from '@/lib/hooks';
import { useState } from 'react';

export default function PWAInstallBanner() {
  const { canInstall, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  if (!canInstall || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-24 left-4 right-4 md:left-auto md:right-6 md:w-80 z-40 glass-card p-4 shadow-2xl border-primary/20"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center flex-shrink-0">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground text-sm">Install GRN Copilot</p>
            <p className="text-xs text-muted-foreground">Add to home screen for quick access</p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={install}
          className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl gradient-brand text-white text-sm font-semibold"
        >
          <Download className="w-4 h-4" />
          Install App
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
