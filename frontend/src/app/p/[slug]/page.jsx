import LandingPageClient from './LandingPageClient'

export async function generateMetadata({ params }) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/landing/${params.slug}`, {
      cache: 'no-store'
    })
    const data = await res.json()
    const page = data.landingPage

    const title = page?.aiHeadline || page?.productTitle || 'ReachFlow'
    const description = page?.productDetails || page?.aiDescription || 'Best deals on ReachFlow'
    const image = page?.productImages?.[0] || ''

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: image ? [{ url: image, width: 1200, height: 630, alt: title }] : [],
        url: `https://reachflow-lovat.vercel.app/p/${params.slug}`,
        type: 'website',
        siteName: 'ReachFlow',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: image ? [image] : [],
      },
    }
  } catch {
    return { title: 'ReachFlow' }
  }
}

export default function LandingPage({ params }) {
  return <LandingPageClient params={params} />
}
