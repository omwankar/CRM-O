import type { Metadata } from 'next'
import { DM_Sans, DM_Serif_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { QueryProvider } from '@/lib/query-client'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: '--font-sans',
  display: 'swap',
})

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  variable: '--font-serif',
  display: 'swap',
  weight: ['400'],
})

export const metadata: Metadata = {
  title: 'CRM Portal - Manage Your Business',
  description: 'Comprehensive CRM system for managing certifications, memberships, partnerships, insurance, vendors, buyers, and documents.',
  keywords: ['CRM', 'Business Management', 'Certifications', 'Insurance'],
  generator: 'v0.app',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'CRM Portal - Manage Your Business',
    description: 'Comprehensive CRM system for managing certifications, memberships, partnerships, insurance, vendors, buyers, and documents.',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmSerifDisplay.variable} dark`} suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground">
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            forcedTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            {children}
            <Toaster richColors closeButton position="top-right" />
          </ThemeProvider>
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  )
}