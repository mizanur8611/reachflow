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
    const video = page?.productVideo || null
    const url = `https://reachflow-lovat.vercel.app/p/${params.slug}`

    return {
      title,
      description,
      metadataBase: new URL('https://reachflow-lovat.vercel.app'),

      // ── Facebook, WhatsApp, Telegram, LinkedIn ──
      openGraph: {
        title,
        description,
        url,
        type: 'video.other',  // video type হলে video preview দেখাবে
        siteName: 'ReachFlow',
        images: [{ url: image, width: 1200, height: 630, alt: title }],
        videos: video ? [{ url: video, type: 'video/mp4', width: 1280, height: 720 }] : [],
      },

      // ── Twitter / X ──
      twitter: {
        card: video ? 'player' : 'summary_large_image',
        title,
        description,
        images: [image],
        site: '@ReachFlow',
        ...(video && { player: video, playerWidth: '1280', playerHeight: '720' }),
      },

      // ── Extra raw meta tags ──
      other: {
        'og:image': image,
        'og:image:width': '1200',
        'og:image:height': '630',
        'og:image:type': 'image/jpeg',

        // Video tags
        ...(video && {
          'og:video': video,
          'og:video:url': video,
          'og:video:secure_url': video,
          'og:video:type': 'video/mp4',
          'og:video:width': '1280',
          'og:video:height': '720',
        }),

        // TikTok
        'tiktok:title': title,
        'tiktok:description': description,
        'tiktok:image': image,

        'thumbnail': image,
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
