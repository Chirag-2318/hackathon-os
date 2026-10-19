import { FAQ_ITEMS } from '../data/faq';
import { SEO } from '../data/seo';

// Escapes "<" so the JSON can never close the script tag early.
function toJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export function LandingJsonLd() {
  const application = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: '[brackit]',
    description: SEO.description,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  };
  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJson(application) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJson(faq) }} />
    </>
  );
}
