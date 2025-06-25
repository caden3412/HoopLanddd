// app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'College Basketball Scout',
  description: 'Scouting, comparison, and roster analysis for NCAA players',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-black">
        <nav className="flex justify-center space-x-4 py-4 border-b border-gray-200">
          <Link href="/" className="px-4 py-2 hover:underline">🏀 Scout</Link>
          <Link href="/compare" className="px-4 py-2 hover:underline">Compare</Link>
          <Link href="/teams" className="px-4 py-2 hover:underline">Teams</Link>
        </nav>
        <main className="p-4 max-w-5xl mx-auto">{children}</main>
      </body>
    </html>
  );
}
