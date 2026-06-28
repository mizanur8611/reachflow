import './globals.css'
import Providers from '@/components/Providers'

export const metadata = {
  title: 'ReachFlow',
  description: 'Influencer Marketing Platform',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: '#0a0b0f', color: 'white', margin: 0 }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
