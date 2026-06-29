import { Metadata } from 'next';
import GRNListClient from '@/components/grn/GRNListClient';

export const metadata: Metadata = { title: 'GRN Records' };

export default function GRNListPage() {
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <GRNListClient />
    </div>
  );
}
