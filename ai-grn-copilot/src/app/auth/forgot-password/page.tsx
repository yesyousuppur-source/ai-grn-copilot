'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Loader2, Package, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

const schema = z.object({ email: z.string().email('Valid email required') });
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async ({ email }: FormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-8 w-full"
    >
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 rounded-2xl gradient-brand flex items-center justify-center mb-3">
          <Package className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Reset Password</h1>
        <p className="text-muted-foreground text-sm mt-1">
          We'll send a reset link to your email
        </p>
      </div>

      {sent ? (
        <div className="text-center py-4">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="font-semibold text-foreground">Check your email!</p>
          <p className="text-sm text-muted-foreground mt-2">
            We've sent a password reset link. Check your inbox and spam folder.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 mt-4 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                {...register('email')}
                type="email"
                placeholder="you@company.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>
            {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl gradient-brand text-white font-semibold shadow-lg shadow-primary/30 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Send Reset Link
          </button>
          <Link
            href="/auth/login"
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground mt-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </form>
      )}
    </motion.div>
  );
}
