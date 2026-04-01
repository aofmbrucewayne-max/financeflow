import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { AppInitializer } from '@/components/layout/AppInitializer';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/layout/ThemeProvider';


const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FinanceFlow — Personal Finance',
  description: 'Track your income, expenses, budgets, and financial goals.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FinanceFlow',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0a0f',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      style={{ colorScheme: 'dark' }}
    >
      <body
        className="min-h-full"
        style={{ backgroundColor: '#0a0a0f', color: '#e8e8f0' }}
      >
        <AppInitializer />
        <ThemeProvider />
        <Sidebar />

        {/* Desktop: offset sidebar. Mobile: offset top bar + bottom nav */}
        <main className="md:ml-60 pt-14 md:pt-0 pb-24 md:pb-0 min-h-screen">
          <div className="max-w-[1400px] mx-auto p-4 md:p-6">
            {children}
          </div>
        </main>

        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              backgroundColor: '#22223a',
              border: '1px solid #2a2a40',
              color: '#e8e8f0',
            },
          }}
        />
      </body>
    </html>
  );
}
