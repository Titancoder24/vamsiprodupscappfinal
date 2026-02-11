import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PrepAssist | Your Personal AI Mentor for UPSC',
  description: 'India\'s most advanced AI-powered ecosystem for UPSC preparation. Features news feeds, MCQ generating, mind maps, and professional mains evaluation.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}

