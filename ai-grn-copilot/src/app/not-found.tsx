import Link from 'next/link';
import { Package } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center">
        <div className="w-20 h-20 rounded-3xl gradient-brand flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/30">
          <Package className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-6xl font-black gradient-text mb-4">404</h1>
        <h2 className="text-2xl font-bold text-foreground mb-2">Page Not Found</h2>
        <p className="text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-brand text-white font-semibold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
