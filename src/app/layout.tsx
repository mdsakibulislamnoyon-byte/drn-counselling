import type { Metadata } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', weight: ['400', '500', '600'] });

export const metadata: Metadata = {
  title: {
    default: 'DRN Counseling and Consulting, LCSW, PLLC',
    template: '%s | DRN Counseling & Consulting',
  },
  description:
    "Dominick R. Nicotera, LCSW-R, provides individual, family, and group therapy in Utica, NY — plus a professional training academy for newly graduated mental health clinicians.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body>{children}</body>
    </html>
  );
}
