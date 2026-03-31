import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { AppInitializer } from '@/components/layout/AppInitializer';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FinanceFlow — Personal Finance',
  description: 'Track your income, expenses, budgets, and financial goals.',
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
        <Sidebar />
        <main className="ml-60 min-h-screen">
          <div className="max-w-[1400px] mx-auto p-6">
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
