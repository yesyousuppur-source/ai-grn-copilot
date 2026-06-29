'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Package, LayoutDashboard, FileText, Upload, History, Settings,
  Building2, ChevronDown, Plus, Boxes, BookOpen, LogOut, Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCompanyStore, useAuthStore } from '@/store';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/invoices', icon: Upload, label: 'Upload Invoice' },
  { href: '/dashboard/grn', icon: FileText, label: 'GRN Records' },
  { href: '/dashboard/templates', icon: BookOpen, label: 'GRN Templates' },
  { href: '/dashboard/history', icon: History, label: 'History' },
];

const bottomItems = [
  { href: '/dashboard/companies', icon: Building2, label: 'Companies' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { companies, activeCompany, setActiveCompany } = useCompanyStore();
  const { logout } = useAuthStore();
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    toast.success('Signed out');
    router.push('/auth/login');
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <div className="w-64 h-full glass border-r border-border/50 flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-border/50">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center shadow-sm shadow-primary/30 flex-shrink-0">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-foreground text-sm leading-tight">AI GRN Copilot</p>
            <p className="text-[10px] text-muted-foreground">Smart GRN Automation</p>
          </div>
        </Link>
      </div>

      {/* Company Switcher */}
      <div className="p-3 border-b border-border/50">
        <button
          onClick={() => setCompanyDropdownOpen(!companyDropdownOpen)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-accent transition-colors text-left"
        >
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">
              {activeCompany?.name || 'Select Company'}
            </p>
            <p className="text-[10px] text-muted-foreground">Active workspace</p>
          </div>
          <ChevronDown
            className={cn(
              'w-4 h-4 text-muted-foreground transition-transform flex-shrink-0',
              companyDropdownOpen && 'rotate-180'
            )}
          />
        </button>

        {/* Dropdown */}
        {companyDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden"
          >
            {companies.map((company) => (
              <button
                key={company.id}
                onClick={() => {
                  setActiveCompany(company);
                  setCompanyDropdownOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-accent transition-colors text-sm',
                  activeCompany?.id === company.id && 'bg-primary/5 text-primary'
                )}
              >
                <Boxes className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{company.name}</span>
                {activeCompany?.id === company.id && (
                  <Star className="w-3 h-3 ml-auto text-primary fill-primary" />
                )}
              </button>
            ))}
            <Link
              href="/dashboard/companies/new"
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors border-t border-border"
              onClick={() => setCompanyDropdownOpen(false)}
            >
              <Plus className="w-4 h-4" />
              Add Company
            </Link>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
          Main
        </p>
        {navItems.map((item) => (
          <SidebarItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            active={isActive(item.href)}
          />
        ))}

        <div className="pt-4">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
            Management
          </p>
          {bottomItems.map((item) => (
            <SidebarItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={isActive(item.href)}
            />
          ))}
        </div>
      </nav>

      {/* User + Logout */}
      <div className="p-3 border-t border-border/50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                     text-muted-foreground hover:text-destructive hover:bg-destructive/10
                     transition-all text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

function SidebarItem({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
}) {
  return (
    <Link href={href} className={cn('sidebar-item', active && 'active')}>
      {active && (
        <motion.div
          layoutId="sidebar-active"
          className="absolute inset-0 bg-primary/10 rounded-xl -z-10"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span>{label}</span>
    </Link>
  );
}
