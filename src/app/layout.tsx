import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'AI GRN Copilot',
    template: '%s | AI GRN Copilot',
  },
  description:
    'AI-powered GRN automation platform for factories, warehouses and stores. Automatically reads supplier invoices, learns your GRN format, fills and validates.',
  keywords: ['GRN', 'Goods Receipt Note', 'Invoice OCR', 'Warehouse Management', 'AI Automation', 'India'],
  authors: [{ name: 'AI GRN Copilot' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'GRN Copilot',
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    siteName: 'AI GRN Copilot',
    title: 'AI GRN Copilot - Smart GRN Automation',
    description: 'AI-powered GRN automation for Indian businesses',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0f1e' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          {children}
          <Toaster
            position="top-right"
            expand
            richColors
            toastOptions={{
              classNames: {
                toast: 'glass border-border',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
