'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, Bell, Sun, Moon, Search, Wifi, WifiOff, User,
  ChevronDown, Check
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useUIStore, useAuthStore, useNotificationStore } from '@/store';
import { formatDate, cn } from '@/lib/utils';
import Link from 'next/link';

export default function Header() {
  const { toggleSidebar } = useUIStore();
  const { user } = useAuthStore();
  const { notifications, unreadCount, markRead, markAllRead } = useNotificationStore();
  const { theme, setTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Online detection
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));
  }

  const initials = user?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <header className="h-14 border-b border-border/50 glass flex items-center px-4 gap-3 flex-shrink-0 z-20">
      {/* Sidebar toggle */}
      <button
        onClick={toggleSidebar}
        className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Search */}
      <button className="flex-1 max-w-sm flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/50 bg-muted/30 text-muted-foreground text-sm hover:border-primary/30 transition-colors">
        <Search className="w-4 h-4" />
        <span>Search GRNs, invoices...</span>
        <kbd className="ml-auto hidden sm:flex items-center gap-1 text-xs border border-border rounded px-1.5 py-0.5">
          <span>⌘</span>K
        </kbd>
      </button>

      <div className="flex items-center gap-1 ml-auto">
        {/* Online status */}
        <div
          className={cn(
            'hidden sm:flex items-center gap-1 text-xs px-2 py-1 rounded-full',
            isOnline ? 'text-green-500' : 'text-destructive'
          )}
        >
          {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          <span className="hidden md:inline">{isOnline ? 'Online' : 'Offline'}</span>
        </div>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full gradient-brand text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-80 glass-card overflow-hidden z-50 shadow-xl"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <p className="font-semibold text-sm">Notifications</p>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-primary hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto scrollbar-thin">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                      No notifications
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markRead(n.id)}
                        className={cn(
                          'px-4 py-3 flex gap-3 hover:bg-accent cursor-pointer transition-colors border-b border-border/30',
                          !n.read && 'bg-primary/5'
                        )}
                      >
                        <div
                          className={cn(
                            'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                            n.type === 'success' && 'bg-green-500',
                            n.type === 'warning' && 'bg-yellow-500',
                            n.type === 'error' && 'bg-red-500',
                            n.type === 'info' && 'bg-blue-500'
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{n.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {n.message}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {formatDate(n.created_at, 'dd MMM, hh:mm a')}
                          </p>
                        </div>
                        {n.read && <Check className="w-3 h-3 text-muted-foreground flex-shrink-0 mt-1" />}
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl hover:bg-accent transition-colors"
          >
            <div className="w-7 h-7 rounded-lg gradient-brand flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
            <span className="text-sm font-medium text-foreground hidden md:block max-w-24 truncate">
              {user?.full_name?.split(' ')[0] || 'User'}
            </span>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-48 glass-card overflow-hidden z-50 shadow-xl"
              >
                <div className="px-3 py-2.5 border-b border-border">
                  <p className="text-sm font-medium truncate">{user?.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <Link
                  href="/dashboard/settings/profile"
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                  onClick={() => setShowProfile(false)}
                >
                  <User className="w-4 h-4" />
                  Profile
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                  onClick={() => setShowProfile(false)}
                >
                  Settings
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
