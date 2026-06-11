// Consistente Next.js metadata/viewport voor alle apps.
// Gebruik in app/layout.tsx:
//   export const metadata = buildMetadata({ appName: 'Flights.', description: '...' })
//   export const viewport = buildViewport()
// Bewust zonder 'next'-import (geen harde peer dep) — de vorm is compatibel
// met Next's Metadata/Viewport types.

import { colors } from './tokens'

export interface AppMetaOpts {
  appName: string                // bijv. 'Flights.' — ook gebruikt voor og/apple titles
  description: string
  ogDescription?: string         // kortere variant voor og/twitter (default: description)
  keywords?: string[]
  ogImage?: string               // default '/og' (route of statisch bestand)
  ogImageAlt?: string
  manifest?: string              // bijv. '/manifest.json'
  url?: string                   // absolute basis-URL → metadataBase + og.url
  titleTemplate?: string         // bijv. '%s | Ludoryn'
  siteName?: string              // og:site_name (default: appName zonder eindpunt)
}

export function buildMetadata(o: AppMetaOpts) {
  const ogDesc = o.ogDescription ?? o.description
  const ogImage = o.ogImage ?? '/og'
  return {
    ...(o.url ? { metadataBase: new URL(o.url) } : {}),
    title: o.titleTemplate ? { default: o.appName, template: o.titleTemplate } : o.appName,
    description: o.description,
    ...(o.keywords ? { keywords: o.keywords } : {}),
    ...(o.manifest ? { manifest: o.manifest } : {}),
    appleWebApp: { capable: true, statusBarStyle: 'default' as const, title: o.appName },
    openGraph: {
      title: o.appName,
      description: ogDesc,
      type: 'website' as const,
      ...(o.url ? { url: o.url } : {}),
      siteName: o.siteName ?? o.appName.replace(/\.$/, ''),
      images: [{ url: ogImage, width: 1200, height: 630, alt: o.ogImageAlt ?? o.appName }],
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: o.appName,
      description: ogDesc,
      images: [ogImage],
    },
  }
}

export function buildViewport(opts?: { themeColor?: string; maxScale?: number }) {
  return {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover' as const,
    themeColor: opts?.themeColor ?? colors.card,
    ...(opts?.maxScale ? { maximumScale: opts.maxScale } : {}),
  }
}
