import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/espace-eleve', '/admin'],
    },
    sitemap: 'https://donnerdelavoix.fr/sitemap.xml',
  }
}
