'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Company, User } from '@/types';
import { useAuthStore, useCompanyStore, useUIStore } from '@/store';
import Sidebar from './Sidebar';
import Header from './Header';
import ChatWidget from '@/components/chat/ChatWidget';

interface AppShellProps {
  user: User;
  companies: Company[];
  children: React.ReactNode;
}

export default function AppShell({ user, companies, children }: AppShellProps) {
  const { setUser } = useAuthStore();
  const { setCompanies, setActiveCompany, activeCompany } = useCompanyStore();
  const { sidebarOpen } = useUIStore();

  useEffect(() => {
    setUser(user);
    setCompanies(companies);
    if (!activeCompany && companies.length > 0) {
      setActiveCompany(companies[0]);
    }
  }, [user, companies]); // eslint-disable-line

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.div
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed lg:relative z-40 h-screen"
          >
            <Sidebar />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => useUIStore.getState().setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* AI Chat Widget */}
      <ChatWidget />
    </div>
  );
}
