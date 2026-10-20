import { IBM_Plex_Mono, Instrument_Sans } from 'next/font/google';

const sans = Instrument_Sans({ subsets: ['latin'], variable: '--font-ops-sans' });
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-ops-mono' });

export const opsFontClass = `${sans.variable} ${mono.variable}`;
