import LandingPageClient from './LandingPageClient'

export async function generateMetadata({ params }) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/landing/${params.slug}`, {
      cache: 'no-store'
    })
    const data = await res.json()
    const page = data.landingPage

    const title = page?.aiHeadline || page?.productTitle || 'ReachFlow'
    const description = page?.aiDescription || page?.productDetails || 'Best deals on ReachFlow'
    const image = page?.productImages?.[0] || 'https://reachflow-lovat.vercel.app/og-default.png'
    const url = `https://reachflow-lovat.vercel.app/p/${params.slug}`

    return {
      title,
      description,
      metadataBase: new URL('https://reachflow-lovat.vercel.app'),

      // ── Facebook, WhatsApp, Telegram, LinkedIn, TikTok ──
      openGraph: {
        title,
        description,
        url,
        type: 'website',
        siteName: 'ReachFlow',
        images: image ? [
          {
            url: image,
            width: 1200,
            height: 630,
            alt: title,
          }
        ] : [],
      },

      // ── Twitter / X ──
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: image ? [image] : [],
        site: '@ReachFlow',
      },

      // ── Extra raw meta tags (Instagram, TikTok, YouTube etc) ──
      other: {
        // Instagram uses og tags (same as Facebook)
        'og:image': image,
        'og:image:width': '1200',
        'og:image:height': '630',
        'og:image:type': 'image/jpeg',

        // TikTok
        'tiktok:title': title,
        'tiktok:description': description,
        'tiktok:image': image,

        // YouTube / Google
        'thumbnail': image,

        // Telegram uses og tags (already covered)
        // LinkedIn uses og tags (already covered)

        // WhatsApp uses og tags (already covered)
        // Extra fallback
        'image': image,
      },
    }
  } catch {
    return { title: 'ReachFlow' }
  }
}

export default function LandingPage({ params }) {
  return <LandingPageClient params={params} />
}


