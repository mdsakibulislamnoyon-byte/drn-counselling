import type { Metadata } from 'next';
import { DM_Sans, DM_Mono, Fraunces } from 'next/font/google';
import './globals.css';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' });
const dmMono = DM_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-dm-mono' });
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
    <html lang="en" className={`${dmSans.variable} ${dmMono.variable} ${fraunces.variable}`}>
      <body>{children}</body>
    </html>
  );
}
