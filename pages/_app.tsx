import '@/styles/globals.css';
import type {AppProps} from 'next/app';
import Head from 'next/head';
import {
  Inter,
  Fira_Code,
  Inconsolata,
  Ubuntu,
  Familjen_Grotesk,
} from 'next/font/google';
import {init, useQuery, tx, transact} from '@instantdb/react';

const inter = Inter({
  variable: '--font-inter',
  display: 'swap',
  subsets: ['latin'],
});

// https://fonts.google.com/specimen/Familjen+Grotesk
// Familjen_Grotesk

const sans = Ubuntu({
  variable: '--font-sans',
  display: 'swap',
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
});

const mono = Fira_Code({
  variable: '--font-mono',
  display: 'swap',
  subsets: ['latin'],
});

const inconsolata = Inconsolata({
  variable: '--font-inconsolata',
  display: 'swap',
  subsets: ['latin'],
});

init({appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!});

export default function App({Component, pageProps}: AppProps) {
  return (
    <>
      <Head>
        <title>Instant Playground</title>
      </Head>
      <style jsx global>
        {`
          :root {
            --font-sans: ${sans.style.fontFamily};
            --font-mono: ${mono.style.fontFamily};
            --font-inconsolata: ${inconsolata.style.fontFamily};
          }
        `}
      </style>
      <Component {...pageProps} />
    </>
  );
}
