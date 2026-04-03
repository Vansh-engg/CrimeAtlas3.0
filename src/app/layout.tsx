import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/navbar';
import SOSButton from '@/components/SOSButton';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CrimeAtlas – Smart Crime Insights',
  description: 'Analyze, Predict, Stay Safe with a premium crime analytics platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-black text-white selection:bg-red-500/30`}>
        <Navbar />
        <main className="pt-16 pb-12 px-4 md:px-8 max-w-[1400px] mx-auto min-h-screen flex flex-col">
          {children}
        </main>
        <SOSButton />
      </body>
    </html>
  );
}
