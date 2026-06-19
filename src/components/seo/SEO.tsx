import { useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface SEOProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  structuredData?: object;
}

const SITE_NAME = 'hithuc';

/** Create or update a `<meta>` tag by name/property. */
function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/** Create or update a `<link>` tag keyed by rel (+ optional hreflang). */
function upsertLink(rel: string, href: string, hreflang?: string) {
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    if (hreflang) el.setAttribute('hreflang', hreflang);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function SEO({
  title,
  description,
  image = '/placeholder.svg',
  url,
  type = 'website',
  structuredData,
}: SEOProps) {
  const { lang } = useLanguage();

  useEffect(() => {
    document.title = title;

    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const canonical = url ?? `${origin}${pathname}`;
    const ogLocale = lang === 'vi' ? 'vi_VN' : 'en_US';

    upsertMeta('name', 'description', description);
    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:image', image);
    upsertMeta('property', 'og:url', canonical);
    upsertMeta('property', 'og:type', type);
    upsertMeta('property', 'og:locale', ogLocale);
    upsertMeta('property', 'og:locale:alternate', lang === 'vi' ? 'en_US' : 'vi_VN');
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', image);

    // Canonical + hreflang alternates (language via ?lang=).
    upsertLink('canonical', canonical);
    upsertLink('alternate', `${origin}${pathname}?lang=vi`, 'vi');
    upsertLink('alternate', `${origin}${pathname}?lang=en`, 'en');
    upsertLink('alternate', `${origin}${pathname}`, 'x-default');

    if (structuredData) {
      let script = document.head.querySelector('script[type="application/ld+json"]');
      if (!script) {
        script = document.createElement('script');
        script.setAttribute('type', 'application/ld+json');
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(structuredData);
    }
  }, [title, description, image, url, type, structuredData, lang]);

  return null;
}
