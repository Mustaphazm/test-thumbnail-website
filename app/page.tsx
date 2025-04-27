// app/page.tsx
import YouTubeThumbnailDownloader from '@/components/youtube-thumbnail-downloader'; // Adjust path if needed
import type { Metadata } from 'next';

// Define static metadata for SEO
export const metadata: Metadata = {
  // Title: Crucial for SEO & user clicks. Be descriptive, include keywords.
  title: 'Free YouTube Thumbnail Downloader (HD, SD, HQ) - Easy & Fast',

  // Description: Appears in search results. Entice users to click. Include keywords naturally.
  description: 'Download any YouTube video thumbnail in HD, SD, HQ quality instantly and for free. Simple online tool - paste URL, get thumbnails. Supports Shorts. No software needed.',

  // Keywords: Terms users might search for.
  keywords: [
        'youtube thumbnail downloader',
        'download youtube thumbnail',
        'youtube thumbnail grabber',
        'get youtube thumbnail',
        'yt thumbnail downloader',
        'youtube video thumbnail',
        'hd youtube thumbnail',
        'free youtube thumbnail downloader',
        'online youtube thumbnail tool',
        'save youtube thumbnail',
        'extract youtube thumbnail',
        'youtube thumbnail saver',
        'youtube shorts thumbnail',
        'youtube picture download',
        'get video cover image youtube',
        // Add keywords in other key languages if desired
        'téléchargeur miniature youtube',
        'descargador miniaturas youtube',
        'youtube vorschaubild downloader',
        'скачать превью ютуб',
        'youtube サムネイル ダウンロード',
     ],

   // Open Graph (for Facebook, LinkedIn, etc.)
   openGraph: {
       title: 'Free YouTube Thumbnail Downloader (HD, SD, HQ)',
       description: 'Instantly download high-quality YouTube thumbnails for free. Easy online tool.',
       url: 'https://yourdomain.com', // <<< CHANGE TO YOUR ACTUAL DOMAIN
       siteName: 'YouTube Thumbnail Downloader', // Or your site's name
       type: 'website',
       locale: 'en_US', // Default locale
       // Optional: Add a preview image URL
       // images: [{ url: 'https://yourdomain.com/og-image.png', width: 1200, height: 630 }],
   },

    // Twitter Card
    twitter: {
      card: 'summary_large_image', // Use 'summary' if you don't have a large image
      title: 'Free YouTube Thumbnail Downloader (HD, SD, HQ) - Easy & Fast',
      description: 'Download YouTube video thumbnails in all qualities instantly. Free, fast, online tool.',
      // Optional: Add Twitter-specific image URL
      // images: ['https://yourdomain.com/twitter-image.png'],
      // Optional: Add your Twitter handle
      // creator: '@yourTwitterHandle',
   },

   // Helps Google understand the site's main URL
   alternates: {
     canonical: 'https://yourdomain.com', // <<< CHANGE TO YOUR ACTUAL DOMAIN
     // If you later create separate language routes (e.g., /fr, /es), add them here:
     // languages: {
     //   'en-US': 'https://yourdomain.com',
     //   'fr-FR': 'https://yourdomain.com/fr',
     //   'es-ES': 'https://yourdomain.com/es',
     // },
   },

   // Favicon/Manifest related - Next.js might pick these up automatically from app/
   // but since yours are in public/favicon, you might need manual links in layout.tsx if they don't work.
   // icons: {
   //   icon: '/favicon/favicon-32x32.png',
   //   shortcut: '/favicon/favicon-16x16.png',
   //   apple: '/favicon/apple-touch-icon.png',
   // },
   // manifest: '/favicon/site.webmanifest',
};


export default function HomePage() {
  return (
    <>
      <YouTubeThumbnailDownloader />
    </>
  );
}
