'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User, Key, Bell, Palette, Brain, Eye, EyeOff, Save,
  Loader2, CheckCircle2, Shield, Zap, Database
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { User as UserType, Company } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  profile: UserType;
  companies: Company[];
}

const TABS = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'ai', label: 'AI & OCR', icon: Brain },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'appearance', label: 'Appearance', icon: Palette },
  { key: 'security', label: 'Security', icon: Shield },
] as const;

export default function SettingsClient({ profile, companies }: Props) {
  const [activeTab, setActiveTab] = useState<'profile' | 'ai' | 'notifications' | 'appearance' | 'security'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const { theme, setTheme } = useTheme();

  const settings = (profile?.settings || {}) as {
    ocr_provider?: string;
    ai_provider?: string;
    notifications_email?: boolean;
    notifications_push?: boolean;
  };

  const [ocrProvider, setOcrProvider] = useState(settings.ocr_provider || 'openai');
  const [aiProvider, setAiProvider] = useState(settings.ai_provider || 'openai');
  const [notifEmail, setNotifEmail] = useState(settings.notifications_email ?? true);
  const [notifPush, setNotifPush] = useState(settings.notifications_push ?? true);
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [mistralKey, setMistralKey] = useState('');
  const [googleKey, setGoogleKey] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      full_name: profile?.full_name || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
    },
  });

  const saveProfile = async (data: Record<string, string>) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Save failed');
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const saveAISettings = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings/ai', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ocr_provider: ocrProvider,
          ai_provider: aiProvider,
          openai_key: openaiKey || undefined,
          anthropic_key: anthropicKey || undefined,
          mistral_key: mistralKey || undefined,
          google_key: googleKey || undefined,
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      toast.success('AI settings saved');
    } catch {
      toast.error('Failed to save AI settings');
    } finally {
      setIsSaving(false);
    }
  };

  const saveNotifications = async () => {
    setIsSaving(true);
    try {
      await fetch('/api/settings/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications_email: notifEmail, notifications_push: notifPush }),
      });
      toast.success('Notification preferences saved');
    } catch {
      toast.error('Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab navigation */}
      <div className="glass-card p-1 flex overflow-x-auto scrollbar-thin gap-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap flex-shrink-0 transition-all',
              activeTab === key
                ? 'gradient-brand text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Profile */}
      {activeTab === 'profile' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-5">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            Profile Information
          </h2>
          <form onSubmit={handleSubmit(saveProfile)} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name</label>
              <input
                {...register('full_name', { required: 'Name required' })}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
              <input
                {...register('email')}
                type="email"
                disabled
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm opacity-60 cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Phone</label>
              <input
                {...register('phone')}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-brand text-white text-sm font-semibold shadow-lg shadow-primary/20 disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Profile
            </button>
          </form>
        </motion.div>
      )}

      {/* AI & OCR */}
      {activeTab === 'ai' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="glass-card p-6 space-y-5">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              AI Provider
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {['openai', 'anthropic'].map((p) => (
                <button
                  key={p}
                  onClick={() => setAiProvider(p)}
                  className={cn(
                    'p-4 rounded-xl border-2 text-left transition-all',
                    aiProvider === p ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  )}
                >
                  <p className="font-semibold text-foreground capitalize">{p === 'openai' ? 'OpenAI' : 'Anthropic'}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {p === 'openai' ? 'GPT-4o (Recommended)' : 'Claude Sonnet'}
                  </p>
                  {aiProvider === p && <CheckCircle2 className="w-4 h-4 text-primary mt-2" />}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 space-y-5">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" />
              OCR Provider
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { value: 'openai', label: 'OpenAI Vision', desc: 'GPT-4o Vision OCR' },
                { value: 'google', label: 'Google Document AI', desc: 'Enterprise grade' },
                { value: 'mistral', label: 'Mistral OCR', desc: 'Fast & accurate' },
              ].map((p) => (
                <button
                  key={p.value}
                  onClick={() => setOcrProvider(p.value)}
                  className={cn(
                    'p-4 rounded-xl border-2 text-left transition-all',
                    ocrProvider === p.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  )}
                >
                  <p className="font-semibold text-foreground text-sm">{p.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{p.desc}</p>
                  {ocrProvider === p.value && <CheckCircle2 className="w-4 h-4 text-primary mt-2" />}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 space-y-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Key className="w-4 h-4 text-primary" />
              API Keys
            </h2>
            <p className="text-xs text-muted-foreground">
              API keys are stored securely and never logged. Leave blank to use environment variables.
            </p>
            {[
              { key: 'openai', label: 'OpenAI API Key', value: openaiKey, setter: setOpenaiKey, show: showOpenAIKey, toggle: setShowOpenAIKey },
              { key: 'anthropic', label: 'Anthropic API Key', value: anthropicKey, setter: setAnthropicKey, show: showAnthropicKey, toggle: setShowAnthropicKey },
            ].map(({ key, label, value, setter, show, toggle }) => (
              <div key={key}>
                <label className="text-sm font-medium text-foreground mb-1.5 block">{label}</label>
                <div className="relative">
                  <input
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    placeholder="sk-..."
                    className="w-full px-4 py-2.5 pr-12 rounded-xl border border-border bg-background/50 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <button
                    type="button"
                    onClick={() => toggle(!show)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={saveAISettings}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-brand text-white text-sm font-semibold shadow-lg shadow-primary/20 disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save AI Settings
            </button>
          </div>
        </motion.div>
      )}

      {/* Notifications */}
      {activeTab === 'notifications' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-5">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            Notification Preferences
          </h2>
          <div className="space-y-4">
            {[
              { label: 'Email Notifications', desc: 'Receive GRN updates via email', value: notifEmail, setter: setNotifEmail },
              { label: 'Push Notifications', desc: 'Browser push notifications', value: notifPush, setter: setNotifPush },
            ].map(({ label, desc, value, setter }) => (
              <div key={label} className="flex items-center justify-between p-4 rounded-xl border border-border">
                <div>
                  <p className="font-medium text-foreground text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <button
                  onClick={() => setter(!value)}
                  className={cn(
                    'w-12 h-6 rounded-full transition-all relative',
                    value ? 'gradient-brand' : 'bg-muted'
                  )}
                >
                  <span className={cn(
                    'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all',
                    value ? 'left-7' : 'left-1'
                  )} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={saveNotifications}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-brand text-white text-sm font-semibold"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Preferences
          </button>
        </motion.div>
      )}

      {/* Appearance */}
      {activeTab === 'appearance' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-5">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Palette className="w-4 h-4 text-primary" />
            Theme
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'light', label: 'Light', preview: 'bg-white border-gray-200' },
              { value: 'dark', label: 'Dark', preview: 'bg-gray-900 border-gray-700' },
              { value: 'system', label: 'System', preview: 'bg-gradient-to-r from-white to-gray-900' },
            ].map(({ value, label, preview }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  'p-4 rounded-xl border-2 transition-all text-center',
                  theme === value ? 'border-primary' : 'border-border hover:border-primary/50'
                )}
              >
                <div className={cn('h-12 rounded-lg mb-2 border', preview)} />
                <p className="text-sm font-medium text-foreground">{label}</p>
                {theme === value && <CheckCircle2 className="w-4 h-4 text-primary mx-auto mt-1" />}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Security */}
      {activeTab === 'security' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-5">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Security
          </h2>
          <div className="space-y-3">
            <div className="p-4 rounded-xl border border-border">
              <p className="font-medium text-foreground text-sm mb-1">Change Password</p>
              <p className="text-xs text-muted-foreground mb-3">Use a strong password with at least 8 characters</p>
              <button
                onClick={async () => {
                  const res = await fetch('/api/settings/change-password', { method: 'POST' });
                  if (res.ok) toast.success('Password reset email sent');
                }}
                className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-accent transition-colors"
              >
                Send Reset Email
              </button>
            </div>
            <div className="p-4 rounded-xl border border-border">
              <p className="font-medium text-foreground text-sm mb-1">Active Sessions</p>
              <p className="text-xs text-muted-foreground">1 active session on this device</p>
            </div>
            <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5">
              <p className="font-medium text-red-600 text-sm mb-1">Danger Zone</p>
              <p className="text-xs text-muted-foreground mb-3">Permanently delete your account and all data</p>
              <button className="px-4 py-2 rounded-xl border border-red-500/30 text-red-600 text-sm hover:bg-red-500/10 transition-colors">
                Delete Account
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
