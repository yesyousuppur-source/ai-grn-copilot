'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-10 text-center max-w-md w-full"
      >
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Something went wrong</h2>
        <p className="text-muted-foreground text-sm mb-2">
          {error.message || 'An unexpected error occurred'}
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground font-mono mb-6">
            Error ID: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-brand text-white font-semibold mx-auto shadow-lg shadow-primary/20"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </motion.div>
    </div>
  );
}
