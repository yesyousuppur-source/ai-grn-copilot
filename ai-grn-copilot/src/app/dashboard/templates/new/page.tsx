import { Metadata } from 'next';
import NewTemplateClient from '@/components/templates/NewTemplateClient';

export const metadata: Metadata = { title: 'New Template' };

export default function NewTemplatePage() {
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Create GRN Template</h1>
        <p className="text-muted-foreground mt-1">
          Upload your GRN form — AI detects all fields automatically
        </p>
      </div>
      <NewTemplateClient />
    </div>
  );
}
