import { Metadata } from 'next';
import GRNNewClient from '@/components/grn/GRNNewClient';

export const metadata: Metadata = { title: 'Create GRN' };

export default function GRNNewPage() {
  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Create GRN</h1>
        <p className="text-muted-foreground mt-1">
          AI auto-fills your GRN template from the extracted invoice
        </p>
      </div>
      <GRNNewClient />
    </div>
  );
}
