'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, Package, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

const schema = z
  .object({
    full_name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Valid email required'),
    password: z.string().min(8, 'Minimum 8 characters'),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

type FormData = z.infer<typeof schema>;

const features = [
  'AI-powered invoice extraction',
  'Automatic GRN filling',
  'Smart validation engine',
  'Continuous AI learning',
];

export default function SignupForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { full_name: data.full_name },
        },
      });
      if (error) throw error;
      toast.success('Account created! Please verify your email.');
      router.push('/auth/login');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card p-8 w-full"
    >
      <div className="flex flex-col items-center mb-6">
        <div className="w-12 h-12 rounded-2xl gradient-brand flex items-center justify-center mb-3 shadow-lg shadow-primary/30">
          <Package className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Start automating your GRN process
        </p>
      </div>

      {/* Feature list */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        {features.map((f) => (
          <div key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0" />
            {f}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Full Name
          </label>
          <input
            {...register('full_name')}
            type="text"
            autoComplete="name"
            placeholder="Your full name"
            className="w-full px-4 py-3 rounded-xl border border-border bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
          {errors.full_name && (
            <p className="text-destructive text-xs mt-1">{errors.full_name.message}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Email Address
          </label>
          <input
            {...register('email')}
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            className="w-full px-4 py-3 rounded-xl border border-border bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
          {errors.email && (
            <p className="text-destructive text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Password
          </label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Minimum 8 characters"
              className="w-full px-4 py-3 pr-12 rounded-xl border border-border bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-destructive text-xs mt-1">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Confirm Password
          </label>
          <input
            {...register('confirm_password')}
            type="password"
            autoComplete="new-password"
            placeholder="Repeat password"
            className="w-full px-4 py-3 rounded-xl border border-border bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
          {errors.confirm_password && (
            <p className="text-destructive text-xs mt-1">{errors.confirm_password.message}</p>
          )}
        </div>

        <motion.button
          type="submit"
          disabled={isLoading}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 rounded-xl gradient-brand text-white font-semibold
                     shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:opacity-90
                     transition-all flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
          {isLoading ? 'Creating account...' : 'Create Free Account'}
        </motion.button>

        <p className="text-xs text-muted-foreground text-center">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-4">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
