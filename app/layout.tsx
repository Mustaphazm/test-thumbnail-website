import type React from "react"
import "./globals.css"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Downloader YouTube Thumbnail",
  description:
    "Easily download any YouTube video thumbnail in HD, SD, and multiple resolutions for free. Paste the video URL to get high-quality thumbnails instantly.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
        <link rel="manifest" href="/favicon/site.webmanifest" />
        {/* AdSense Script - Added directly in head instead of using Next.js Script component */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9454375933088272"
          crossOrigin="anonymous"
        ></script>
      </head>
      <body>{children}</body>
    </html>
  )
}
