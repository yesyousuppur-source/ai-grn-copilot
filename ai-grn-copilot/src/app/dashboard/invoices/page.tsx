import { Metadata } from 'next';
import InvoiceUploadClient from '@/components/invoices/InvoiceUploadClient';

export const metadata: Metadata = { title: 'Upload Invoice' };

export default function InvoicePage() {
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Upload Invoice</h1>
        <p className="text-muted-foreground mt-1">
          Upload a supplier invoice — AI will extract all data automatically
        </p>
      </div>
      <InvoiceUploadClient />
    </div>
  );
}
