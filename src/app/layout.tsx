import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ReActivate - AI Dead-Database Reactivation Engine',
  description:
    'Turn your dormant CRM contacts into active leads with AI-powered reactivation campaigns. Personalized drip sequences that bring dead databases back to life.',
  keywords: 'CRM reactivation, dead database, lead reactivation, AI drip campaigns, real estate leads',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
