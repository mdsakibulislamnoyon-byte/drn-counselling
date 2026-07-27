import type { Metadata } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', weight: ['400', '500', '600'] });

export const metadata: Metadata = {
  title: {
    default: 'Dominik Nicotera Counselling',
    template: '%s | Dominik Nicotera Counselling',
  },
  description:
    'Mental health counseling practice and professional training academy led by Dominik Nicotera.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body>{children}</body>
    </html>
  );
}
