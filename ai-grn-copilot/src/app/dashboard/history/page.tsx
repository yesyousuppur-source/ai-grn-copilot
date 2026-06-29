import { Metadata } from 'next';
import HistoryClient from '@/components/history/HistoryClient';

export const metadata: Metadata = { title: 'History' };

export default function HistoryPage() {
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">History</h1>
        <p className="text-muted-foreground mt-1">All generated GRNs and activity logs</p>
      </div>
      <HistoryClient />
    </div>
  );
}
