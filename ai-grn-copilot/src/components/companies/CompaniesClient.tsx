'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Plus, Settings, Users, BookOpen, ArrowRight,
  Edit, Trash2, Globe, Phone, Mail, MapPin
} from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Company } from '@/types';
import { formatDate, INDIAN_STATES } from '@/lib/utils';
import { toast } from 'sonner';
import { useCompanyStore } from '@/store';

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  gstin: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

interface Props {
  companies: Company[];
  userId: string;
}

export default function CompaniesClient({ companies: initial, userId }: Props) {
  const [companies, setCompanies] = useState<Company[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setActiveCompany } = useCompanyStore();

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const openEdit = (company: Company) => {
    setEditingId(company.id);
    setValue('name', company.name);
    setValue('gstin', company.gstin || '');
    setValue('address', company.address || '');
    setValue('city', company.city || '');
    setValue('state', company.state || '');
    setValue('pincode', company.pincode || '');
    setValue('phone', company.phone || '');
    setValue('email', company.email || '');
    setShowForm(true);
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const method = editingId ? 'PATCH' : 'POST';
      const url = editingId ? `/api/companies/${editingId}` : '/api/companies';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, owner_id: userId }),
      });
      if (!res.ok) throw new Error('Save failed');
      const { data: saved } = await res.json();

      if (editingId) {
        setCompanies((prev) => prev.map((c) => (c.id === editingId ? saved : c)));
        toast.success('Company updated');
      } else {
        setCompanies((prev) => [saved, ...prev]);
        setActiveCompany(saved);
        toast.success('Company created!');
      }
      setShowForm(false);
      setEditingId(null);
      reset();
    } catch {
      toast.error('Failed to save company');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this company and all its data?')) return;
    const res = await fetch(`/api/companies/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setCompanies((prev) => prev.filter((c) => c.id !== id));
      toast.success('Company deleted');
    } else {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Companies</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your business entities</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); reset(); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-white text-sm font-semibold shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          Add Company
        </button>
      </div>

      {/* Create/Edit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card overflow-hidden"
          >
            <div className="p-5 border-b border-border">
              <h2 className="font-semibold text-foreground">
                {editingId ? 'Edit Company' : 'New Company'}
              </h2>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Company Name *</label>
                  <input
                    {...register('name')}
                    placeholder="ABC Manufacturing Pvt Ltd"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">GSTIN</label>
                  <input
                    {...register('gstin')}
                    placeholder="27AABCU9603R1ZX"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Phone</label>
                  <input
                    {...register('phone')}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="accounts@company.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">City</label>
                  <input
                    {...register('city')}
                    placeholder="Mumbai"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">State</label>
                  <select
                    {...register('state')}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Pincode</label>
                  <input
                    {...register('pincode')}
                    placeholder="400001"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Address</label>
                  <textarea
                    {...register('address')}
                    placeholder="Full address..."
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingId(null); reset(); }}
                  className="px-4 py-2.5 rounded-xl border border-border text-sm hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl gradient-brand text-white text-sm font-semibold shadow-lg shadow-primary/20 disabled:opacity-60"
                >
                  {isSubmitting ? 'Saving...' : editingId ? 'Update Company' : 'Create Company'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Company cards */}
      {companies.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-foreground mb-2">No companies yet</h3>
          <p className="text-muted-foreground text-sm mb-4">Add your first company to start managing GRNs</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-brand text-white font-semibold"
          >
            <Plus className="w-4 h-4" />
            Add Company
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {companies.map((company, i) => (
            <motion.div
              key={company.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-5 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl gradient-brand flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {company.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground">{company.name}</h3>
                  {company.gstin && (
                    <p className="text-xs font-mono text-muted-foreground mt-0.5">{company.gstin}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(company)} className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(company.id)} className="p-2 rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-colors text-muted-foreground">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-1.5">
                {company.city && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5" />
                    {[company.city, company.state, company.pincode].filter(Boolean).join(', ')}
                  </div>
                )}
                {company.phone && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="w-3.5 h-3.5" />
                    {company.phone}
                  </div>
                )}
                {company.email && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="w-3.5 h-3.5" />
                    {company.email}
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center gap-3 pt-4 border-t border-border">
                <Link
                  href={`/dashboard/templates?company=${company.id}`}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Templates
                </Link>
                <Link
                  href={`/dashboard/grn?company=${company.id}`}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" />
                  GRNs
                </Link>
                <button
                  onClick={() => setActiveCompany(company)}
                  className="ml-auto flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Switch to this <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
