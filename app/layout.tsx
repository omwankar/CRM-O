import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { QueryProvider } from '@/lib/query-client'
import './globals.css'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
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
    <html lang="en" className={`${plusJakarta.variable} light`} suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground">
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            forcedTheme="light"
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